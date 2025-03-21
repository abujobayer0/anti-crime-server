import { createServer, Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { seed } from "./app/utils/seedingAdmin";
import initializeIndexes from "./app/module";
import cluster, { Worker } from "cluster";
import os from "os";
import { cpus } from "os";
import fs from "fs";
import path from "path";
import winston from "winston";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

interface WorkerMessage {
  type: string;
  pid?: number;
  data?: any;
}

interface ClusterWorker extends Worker {
  lastHeartbeat?: number;
  startTime?: number;
}

interface ConnectionOptions extends mongoose.ConnectOptions {
  serverSelectionTimeoutMS: number;
  connectTimeoutMS: number;
  maxPoolSize: number;
  minPoolSize: number;
  socketTimeoutMS: number;
}

const numCPUs: number = Math.max(1, cpus().length - 1);
const HEARTBEAT_INTERVAL: number = 30000; // 30 seconds
const GRACEFUL_SHUTDOWN_TIMEOUT: number = 15000; // 15 seconds
const DB_MAX_RETRIES: number = 7;
const MEMORY_THRESHOLD: number = 0.9; // 90% memory usage threshold

// Setup structured logging
const setupLogger = () => {
  const logsDir: string = path.join(__dirname, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logger = winston.createLogger({
    level: config.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: "api-service" },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      }),
    ],
  });

  // Add console transport for non-production environments
  if (config.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return logger;
};

const logger = setupLogger();

// Initialize error monitoring (Sentry)
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
  });
  logger.info("Sentry initialized for error monitoring");
}

// Master process logic
if (cluster.isPrimary) {
  logger.info(`Master process ${process.pid} is running on ${numCPUs} cores`);

  // Store worker references
  const workers: Record<string, ClusterWorker> = {};
  let isShuttingDown: boolean = false;

  // Statistics tracking
  let totalRequests: number = 0;
  let startTime: number = Date.now();

  // Collect metrics from workers
  const metrics = {
    activeConnections: 0,
    requestsPerMinute: 0,
    lastMinuteRequests: 0,
    peakConnections: 0,
    totalErrors: 0,
  };

  // Track request rate
  setInterval(() => {
    metrics.requestsPerMinute = metrics.lastMinuteRequests;
    metrics.lastMinuteRequests = 0;

    // Log periodic stats
    logger.info(
      `Stats: ${metrics.requestsPerMinute} rpm, ${metrics.activeConnections} connections, ${metrics.totalErrors} errors`
    );
  }, 60000);

  // Function to create a worker
  const createWorker = (): ClusterWorker => {
    const worker: ClusterWorker = cluster.fork();
    workers[worker.id] = worker;
    worker.startTime = Date.now();

    // Setup message handling from worker
    worker.on("message", (message: WorkerMessage) => {
      if (message.type === "heartbeat") {
        worker.lastHeartbeat = Date.now();

        // Update metrics from worker data
        if (message.data) {
          if (message.data.connections) {
            metrics.activeConnections += message.data.connections;
            metrics.peakConnections = Math.max(
              metrics.peakConnections,
              metrics.activeConnections
            );
          }
        }
      } else if (message.type === "log" && message.data) {
        logger["info"](message.data.message, message.data.meta);
      } else if (message.type === "request") {
        totalRequests++;
        metrics.lastMinuteRequests++;
      } else if (message.type === "error") {
        metrics.totalErrors++;
      }
    });

    return worker;
  };

  // Fork workers, one per CPU
  for (let i = 0; i < numCPUs; i++) {
    createWorker();
  }

  // Monitor worker health with heartbeats
  setInterval(() => {
    if (isShuttingDown) return;

    const now: number = Date.now();
    metrics.activeConnections = 0; // Reset and collect from workers

    // Check system resources
    const memoryUsage = process.memoryUsage();
    const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (heapUsedPercentage > MEMORY_THRESHOLD) {
      logger.warn(
        `High memory usage detected: ${(heapUsedPercentage * 100).toFixed(2)}%`
      );
    }

    // Check each worker's heartbeat
    Object.keys(workers).forEach((id: string) => {
      const worker: ClusterWorker = workers[id];

      // If worker hasn't sent heartbeat in too long, kill it
      if (
        worker.lastHeartbeat &&
        now - worker.lastHeartbeat > HEARTBEAT_INTERVAL * 2
      ) {
        logger.warn(
          `Worker ${worker.process.pid} heartbeat timeout, restarting...`
        );
        worker.kill("SIGTERM");
      }

      // Worker rotation for memory leak prevention
      // Gradually rotate workers rather than all at once
      if (
        worker.startTime &&
        now - worker.startTime > 86400000 + parseInt(id) * 3600000
      ) {
        // stagger by 1h per worker
        logger.info(`Recycling worker ${worker.process.pid} after 24h+ uptime`);
        worker.send({ type: "prepare-shutdown" });

        setTimeout(() => {
          if (workers[id]) {
            workers[id].kill("SIGTERM");
          }
        }, 5000);
      }
    });

    // Log cluster status
    const uptime: number = process.uptime();
    const runTimeHours = (now - startTime) / 3600000;
    logger.info(
      `Cluster uptime: ${(uptime / 3600).toFixed(2)}h, ${Object.keys(workers).length} workers, ` +
        `${totalRequests} total requests, avg ${Math.round(totalRequests / (runTimeHours || 1))} req/hour`
    );
  }, HEARTBEAT_INTERVAL);

  // Handle worker exit and respawn
  cluster.on("exit", (worker: Worker, code: number, signal: string) => {
    const pid: number | undefined = worker.process.pid;
    delete workers[worker.id];

    logger.warn(`Worker ${pid} died with code ${code} and signal ${signal}`);

    // Don't respawn if we're shutting down
    if (!isShuttingDown) {
      const newWorker: ClusterWorker = createWorker();
      logger.info(
        `New worker ${newWorker.process.pid} started to replace dead worker ${pid}`
      );
    }
  });

  // Handle master process signals for graceful shutdown
  const setupGracefulShutdown = () => {
    isShuttingDown = true;
    logger.info(
      "Master received shutdown signal, beginning graceful shutdown..."
    );

    // First stop accepting new connections
    Object.values(workers).forEach((worker: ClusterWorker) => {
      worker.send({ type: "shutdown" });
    });

    // Give workers time to finish current requests
    setTimeout(() => {
      logger.info("Terminating remaining workers");
      Object.values(workers).forEach((worker: ClusterWorker) => {
        worker.kill("SIGTERM");
      });

      // Final cleanup and exit
      setTimeout(() => {
        logger.info("Master shutdown complete");
        process.exit(0);
      }, 2000);
    }, GRACEFUL_SHUTDOWN_TIMEOUT);
  };

  // Register signal handlers
  process.on("SIGTERM", setupGracefulShutdown);
  process.on("SIGINT", setupGracefulShutdown);

  // Handle uncaught errors in master
  process.on("uncaughtException", (err: Error) => {
    logger.error("Master uncaught exception:", err);
    setupGracefulShutdown();
  });

  process.on("unhandledRejection", (reason: any) => {
    logger.error("Master unhandled rejection:", reason);
  });
} else {
  // Worker process logic
  let server: Server;
  let shutdownInProgress: boolean = false;
  let isReady: boolean = false;
  let activeConnections: number = 0;
  let connectionCounter: number = 0;
  let requestCounter: number = 0;

  // Send log messages to master
  const logToMaster = (level: string, message: string, meta?: any) => {
    if (process.send) {
      process.send({
        type: "log",
        data: { level, message, meta, pid: process.pid },
      });
    } else {
      // Fallback to console if process.send is not available
      console[level === "error" ? "error" : "log"](message, meta || "");
    }
  };

  // Database connection with retry mechanism and improved options
  const connectWithRetry = async (): Promise<boolean> => {
    let retries: number = 0;

    while (retries < DB_MAX_RETRIES) {
      try {
        const options: ConnectionOptions = {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 50, // Increased for high traffic
          minPoolSize: 5, // Maintain minimum connections
        };

        await mongoose.connect(config.DATABASE_URL!, options);
        logToMaster("info", `Worker ${process.pid} connected to database`);

        // Setup database monitoring
        mongoose.connection.on("error", (err) => {
          logToMaster("error", `Worker ${process.pid} MongoDB error:`, err);
          if (!shutdownInProgress) {
            process.exit(1); // Force restart on DB errors
          }
        });

        // Configure mongoose for production
        mongoose.set("autoIndex", false); // Don't build indexes in production

        return true;
      } catch (err: any) {
        retries++;
        logToMaster(
          "warn",
          `Database connection attempt ${retries}/${DB_MAX_RETRIES} failed: ${err.message}`
        );

        // Wait before next retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries))
        );
      }
    }

    logToMaster(
      "error",
      `Worker ${process.pid} failed to connect to database after ${DB_MAX_RETRIES} attempts`
    );
    return false;
  };

  // Track active connections for graceful shutdown
  const trackConnections = (server: Server) => {
    server.on("connection", (socket) => {
      const id = connectionCounter++;
      activeConnections++;

      // Report connection metrics to master
      if (process.send) {
        process.send({
          type: "metrics",
          data: { activeConnections },
        });
      }

      socket.on("close", () => {
        activeConnections--;
      });
    });
  };

  // Optimize the Express app for high traffic
  const optimizeApp = () => {
    // Add request tracking
    app.use((req, res, next) => {
      const startTime = Date.now();
      requestCounter++;

      // Notify master of request
      if (process.send) {
        process.send({ type: "request" });
      }

      // Track response time
      res.on("finish", () => {
        const duration = Date.now() - startTime;

        // Log slow requests
        if (duration > 1000) {
          logToMaster(
            "warn",
            `Slow request: ${req.method} ${req.url} took ${duration}ms`
          );
        }

        // Log errors
        if (res.statusCode >= 500) {
          if (process.send) {
            process.send({ type: "error" });
          }
        }
      });

      next();
    });

    return app;
  };

  // Main worker function
  async function workerMain(): Promise<void> {
    try {
      // Connect to database with retry mechanism
      const connected: boolean = await connectWithRetry();
      if (!connected) {
        process.exit(1);
        return;
      }

      // Initialize indexes on first run only
      if (cluster?.worker?.id === 1) {
        await initializeIndexes();
        logToMaster("info", "Database indexes verified by worker 1");
      }

      // Optimize app for production
      const optimizedApp = optimizeApp();

      // Create HTTP server with keep-alive optimized
      server = createServer(
        {
          keepAlive: true,
          keepAliveTimeout: 65000, // Slightly higher than ELB/ALB default of 60s
        },
        optimizedApp
      );

      // Track connections for graceful shutdown
      trackConnections(server);

      // Start listening for incoming requests
      server.listen(config.port, () => {
        isReady = true;
        logToMaster(
          "info",
          `Worker ${process.pid} is listening on port ${config.port}`
        );
      });

      // Only seed from one worker on first run
      if (cluster?.worker?.id === 1) {
        await seed();
        logToMaster("info", "Admin seeding completed by worker 1");
      }

      // Implement graceful shutdown
      const gracefulShutdown = (): void => {
        if (shutdownInProgress) return;
        shutdownInProgress = true;

        logToMaster("info", `Worker ${process.pid} shutting down...`);

        // Stop accepting new connections
        isReady = false;
        server.close(async () => {
          // Close database connection
          await mongoose.connection.close();
          logToMaster("info", `Worker ${process.pid} closed all connections`);

          // Exit process
          process.exit(0);
        });

        // Force shutdown after timeout if needed
        setTimeout(() => {
          logToMaster(
            "warn",
            `Worker ${process.pid} could not close connections in time, forcing shutdown`
          );
          process.exit(1);
        }, GRACEFUL_SHUTDOWN_TIMEOUT);
      };

      // Listen for shutdown message from master
      process.on("message", (message: WorkerMessage) => {
        if (message.type === "shutdown") {
          gracefulShutdown();
        } else if (message.type === "prepare-shutdown") {
          // Start rejecting new requests but finish existing ones
          isReady = false;
          logToMaster(
            "info",
            `Worker ${process.pid} preparing for shutdown, no longer accepting new connections`
          );
        }
      });

      // Send regular heartbeats to master
      setInterval(() => {
        if (process.send) {
          process.send({
            type: "heartbeat",
            pid: process.pid,
            data: {
              connections: activeConnections,
              memory: process.memoryUsage(),
              requests: requestCounter,
            },
          });
        }
      }, HEARTBEAT_INTERVAL / 2);

      // Monitor memory usage
      setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const percentUsed = (
          (memoryUsage.heapUsed / memoryUsage.heapTotal) *
          100
        ).toFixed(1);

        if (heapUsedMB > heapTotalMB * 0.85) {
          logToMaster(
            "warn",
            `Worker ${process.pid} high memory usage: ${percentUsed}% (${heapUsedMB}MB/${heapTotalMB}MB)`
          );
        }

        // Reset request counter after reporting
        requestCounter = 0;
      }, 60000);
    } catch (err: any) {
      logToMaster("error", `Worker startup error: ${err.message}`, err);
      process.exit(1);
    }
  }

  workerMain();

  // Handle worker process-level errors
  process.on("unhandledRejection", (err: Error) => {
    logToMaster("error", `Worker ${process.pid} unhandledRejection:`, err);
    if (config.SENTRY_DSN) {
      Sentry.captureException(err);
    }

    // Don't crash the worker for unhandled promises in production
    if (process.env.NODE_ENV !== "production") {
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      }
      setTimeout(() => process.exit(1), 1000);
    }
  });

  process.on("uncaughtException", (err: Error) => {
    logToMaster("error", `Worker ${process.pid} uncaughtException:`, err);
    if (config.SENTRY_DSN) {
      Sentry.captureException(err);
    }

    // Always restart worker on uncaught exceptions
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    }
    setTimeout(() => process.exit(1), 3000);
  });
}
