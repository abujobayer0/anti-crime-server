import { createServer, Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { seed } from "./app/utils/seedingAdmin";
import initializeIndexes from "./app/module";
import cluster, { Worker } from "cluster";
import { cpus } from "os";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import Logger from "./app/utils/logger";
import ServerBanner from "./app/lib/startup.banner";

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

const logger = new Logger("Server");

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

if (cluster.isPrimary) {
  logger.info(`Master process ${process.pid} is running on ${numCPUs} cores`);

  const workers: Record<string, ClusterWorker> = {};
  let isShuttingDown: boolean = false;

  let totalRequests: number = 0;
  let startTime: number = Date.now();

  const metrics = {
    activeConnections: 0,
    requestsPerMinute: 0,
    lastMinuteRequests: 0,
    peakConnections: 0,
    totalErrors: 0,
  };

  setInterval(() => {
    metrics.requestsPerMinute = metrics.lastMinuteRequests;
    metrics.lastMinuteRequests = 0;

    logger.info(
      `Stats: ${metrics.requestsPerMinute} rpm, ${metrics.activeConnections} connections, ${metrics.totalErrors} errors`
    );
  }, 60000);

  const createWorker = (): ClusterWorker => {
    const worker: ClusterWorker = cluster.fork();
    workers[worker.id] = worker;
    worker.startTime = Date.now();

    worker.on("message", (message: WorkerMessage) => {
      if (message.type === "heartbeat") {
        worker.lastHeartbeat = Date.now();

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

  for (let i = 0; i < numCPUs; i++) {
    createWorker();
  }

  setInterval(() => {
    if (isShuttingDown) return;

    const now: number = Date.now();
    metrics.activeConnections = 0;
    const memoryUsage = process.memoryUsage();
    const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (heapUsedPercentage > MEMORY_THRESHOLD) {
      logger.warn(
        `High memory usage detected: ${(heapUsedPercentage * 100).toFixed(2)}%`
      );
    }

    Object.keys(workers).forEach((id: string) => {
      const worker: ClusterWorker = workers[id];
      if (
        worker.lastHeartbeat &&
        now - worker.lastHeartbeat > HEARTBEAT_INTERVAL * 2
      ) {
        logger.warn(
          `Worker ${worker.process.pid} heartbeat timeout, restarting...`
        );
        worker.kill("SIGTERM");
      }
      if (
        worker.startTime &&
        now - worker.startTime > 86400000 + parseInt(id) * 3600000
      ) {
        logger.info(`Recycling worker ${worker.process.pid} after 24h+ uptime`);
        worker.send({ type: "prepare-shutdown" });

        setTimeout(() => {
          if (workers[id]) {
            workers[id].kill("SIGTERM");
          }
        }, 5000);
      }
    });

    const uptime: number = process.uptime();
    const runTimeHours = (now - startTime) / 3600000;
    logger.info(
      `Cluster uptime: ${(uptime / 3600).toFixed(2)}h, ${Object.keys(workers).length} workers, ` +
        `${totalRequests} total requests, avg ${Math.round(totalRequests / (runTimeHours || 1))} req/hour`
    );
  }, HEARTBEAT_INTERVAL);

  cluster.on("exit", (worker: Worker, code: number, signal: string) => {
    const pid: number | undefined = worker.process.pid;
    delete workers[worker.id];

    logger.warn(`Worker ${pid} died with code ${code} and signal ${signal}`);

    if (!isShuttingDown) {
      const newWorker: ClusterWorker = createWorker();
      logger.info(
        `New worker ${newWorker.process.pid} started to replace dead worker ${pid}`
      );
    }
  });

  const setupGracefulShutdown = () => {
    isShuttingDown = true;
    logger.info(
      "Master received shutdown signal, beginning graceful shutdown..."
    );

    Object.values(workers).forEach((worker: ClusterWorker) => {
      worker.send({ type: "shutdown" });
    });

    setTimeout(() => {
      logger.info("Terminating remaining workers");
      Object.values(workers).forEach((worker: ClusterWorker) => {
        worker.kill("SIGTERM");
      });

      setTimeout(() => {
        logger.info("Master shutdown complete");
        process.exit(0);
      }, 2000);
    }, GRACEFUL_SHUTDOWN_TIMEOUT);
  };

  process.on("SIGTERM", setupGracefulShutdown);
  process.on("SIGINT", setupGracefulShutdown);

  process.on("uncaughtException", (err: Error) => {
    logger.error("Master uncaught exception:", err);
    setupGracefulShutdown();
  });

  process.on("unhandledRejection", (reason: any) => {
    logger.error("Master unhandled rejection:", reason);
  });
} else {
  let server: Server;
  let shutdownInProgress: boolean = false;
  let isReady: boolean = false;
  let activeConnections: number = 0;
  let connectionCounter: number = 0;
  let requestCounter: number = 0;

  const logToMaster = (level: string, message: string, meta?: any) => {
    if (process.send) {
      process.send({
        type: "log",
        data: { level, message, meta, pid: process.pid },
      });
    } else {
      console[level === "error" ? "error" : "log"](message, meta || "");
    }
  };

  const connectWithRetry = async (): Promise<boolean> => {
    let retries: number = 0;

    while (retries < DB_MAX_RETRIES) {
      try {
        const options: ConnectionOptions = {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 50,
          minPoolSize: 5,
        };

        await mongoose.connect(config.DATABASE_URL!, options);
        logToMaster("info", `Worker ${process.pid} connected to database`);

        mongoose.connection.on("error", (err) => {
          logToMaster("error", `Worker ${process.pid} MongoDB error:`, err);
          if (!shutdownInProgress) {
            process.exit(1);
          }
        });

        mongoose.set("autoIndex", false);

        return true;
      } catch (err: any) {
        retries++;
        logToMaster(
          "warn",
          `Database connection attempt ${retries}/${DB_MAX_RETRIES} failed: ${err.message}`
        );

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

  const trackConnections = (server: Server) => {
    server.on("connection", (socket) => {
      const id = connectionCounter++;
      activeConnections++;

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

  const optimizeApp = () => {
    app.use((req, res, next) => {
      const startTime = Date.now();
      requestCounter++;

      if (process.send) {
        process.send({ type: "request" });
      }

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (duration > 1000) {
          logToMaster(
            "warn",
            `Slow request: ${req.method} ${req.url} took ${duration}ms`
          );
        }

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

  async function workerMain(): Promise<void> {
    try {
      const connected: boolean = await connectWithRetry();
      if (!connected) {
        process.exit(1);
        return;
      }

      if (cluster?.worker?.id === 1) {
        await initializeIndexes();
        logToMaster("info", "Database indexes verified by worker 1");
      }

      const optimizedApp = optimizeApp();

      server = createServer(
        {
          keepAlive: true,
          keepAliveTimeout: 65000,
        },
        optimizedApp
      );

      trackConnections(server);

      server.listen(config.port, () => {
        isReady = true;
        const banner = new ServerBanner(
          logger,
          "Anti-Crime Server",
          "1.0.0",
          process.env.NODE_ENV || "development"
        );

        banner.displayBanner(config.port);

        logger.info("All services initialized successfully");
        logger.info("Server is ready to accept connections");
        logToMaster(
          "info",
          `Worker ${process.pid} is listening on port ${config.port}`
        );
      });

      if (cluster?.worker?.id === 1) {
        await seed();
        logToMaster("info", "Admin seeding completed by worker 1");
      }

      const gracefulShutdown = (): void => {
        if (shutdownInProgress) return;
        shutdownInProgress = true;

        logToMaster("info", `Worker ${process.pid} shutting down...`);

        isReady = false;
        server.close(async () => {
          await mongoose.connection.close();
          logToMaster("info", `Worker ${process.pid} closed all connections`);

          process.exit(0);
        });

        setTimeout(() => {
          logToMaster(
            "warn",
            `Worker ${process.pid} could not close connections in time, forcing shutdown`
          );
          process.exit(1);
        }, GRACEFUL_SHUTDOWN_TIMEOUT);
      };

      process.on("message", (message: WorkerMessage) => {
        if (message.type === "shutdown") {
          gracefulShutdown();
        } else if (message.type === "prepare-shutdown") {
          isReady = false;
          logToMaster(
            "info",
            `Worker ${process.pid} preparing for shutdown, no longer accepting new connections`
          );
        }
      });

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

        requestCounter = 0;
      }, 60000);
    } catch (err: any) {
      logToMaster("error", `Worker startup error: ${err.message}`, err);
      process.exit(1);
    }
  }

  workerMain();

  process.on("unhandledRejection", (err: Error) => {
    logToMaster("error", `Worker ${process.pid} unhandledRejection:`, err);
    if (config.SENTRY_DSN) {
      Sentry.captureException(err);
    }

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

    if (server) {
      server.close(() => {
        process.exit(1);
      });
    }
    setTimeout(() => process.exit(1), 3000);
  });
}
