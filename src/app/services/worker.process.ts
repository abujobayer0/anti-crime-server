import { createServer, Server } from "http";
import mongoose from "mongoose";
import * as Sentry from "@sentry/node";
import { WorkerProcessOptions } from "../interface/server.types";
import ServerBanner from "../lib/startup.banner";

export class WorkerProcess {
  private server: Server | null = null;
  private shutdownInProgress: boolean = false;
  private isReady: boolean = false;
  private logger: any;
  private metrics: any;
  private options: WorkerProcessOptions;
  private activeConnections: number = 0;
  private connectionCounter: number = 0;
  private requestCounter: number = 0;

  constructor(options: WorkerProcessOptions) {
    this.logger = options.logger;
    this.metrics = options.metrics;
    this.options = options;
  }

  public async start(app: any, port: any): Promise<void> {
    const optimizedApp = this.optimizeApp(app);

    this.server = createServer(
      {
        keepAlive: true,
        keepAliveTimeout: 65000,
      },
      optimizedApp
    );

    this.trackConnections(this.server);
    this.setupEventHandlers();
    this.startMonitoring();

    return new Promise((resolve) => {
      this.server!.listen({ port, host: "0.0.0.0" }, () => {
        this.isReady = true;
        const banner = new ServerBanner(
          this.logger,
          "Anti-Crime Server",
          "1.0.0",
          process.env.NODE_ENV || "development"
        );

        banner.displayBanner(port);
        this.logger.info("All services initialized successfully");
        this.logger.info("Server is ready to accept connections");
        this.logToMaster(
          "info",
          `Worker ${process.pid} is listening on port ${port}`
        );

        resolve();
      });
    });
  }

  private optimizeApp(app: any): any {
    app.use((req: any, res: any, next: Function) => {
      const startTime = Date.now();
      this.requestCounter++;

      if (process.send) {
        process.send({ type: "request" });
      }

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (duration > 1000) {
          this.logToMaster(
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
  }

  private trackConnections(server: Server): void {
    server.on("connection", (socket) => {
      const id = this.connectionCounter++;
      this.activeConnections++;

      if (process.send) {
        process.send({
          type: "metrics",
          data: { activeConnections: this.activeConnections },
        });
      }

      socket.on("close", () => {
        this.activeConnections--;
      });
    });
  }

  private setupEventHandlers(): void {
    process.on("message", (message: any) => {
      if (message.type === "shutdown") {
        this.gracefulShutdown();
      } else if (message.type === "prepare-shutdown") {
        this.isReady = false;
        this.logToMaster(
          "info",
          `Worker ${process.pid} preparing for shutdown, no longer accepting new connections`
        );
      }
    });

    process.on("unhandledRejection", (err: Error) => {
      this.logToMaster(
        "error",
        `Worker ${process.pid} unhandledRejection:`,
        err
      );
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
      }

      if (process.env.NODE_ENV !== "production") {
        this.exitGracefully(1);
      }
    });

    process.on("uncaughtException", (err: Error) => {
      this.logToMaster(
        "error",
        `Worker ${process.pid} uncaughtException:`,
        err
      );
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
      }

      this.exitGracefully(1);
    });
  }

  private startMonitoring(): void {
    setInterval(() => {
      if (process.send) {
        process.send({
          type: "heartbeat",
          pid: process.pid,
          data: {
            connections: this.activeConnections,
            memory: process.memoryUsage(),
            requests: this.requestCounter,
          },
        });
      }
    }, this.options.heartbeatInterval / 2);

    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const percentUsed = (
        (memoryUsage.heapUsed / memoryUsage.heapTotal) *
        100
      ).toFixed(1);

      if (heapUsedMB > heapTotalMB * 0.85) {
        this.logToMaster(
          "warn",
          `Worker ${process.pid} high memory usage: ${percentUsed}% (${heapUsedMB}MB/${heapTotalMB}MB)`
        );
      }

      this.requestCounter = 0;
    }, 60000);
  }

  private gracefulShutdown(): void {
    if (this.shutdownInProgress) return;
    this.shutdownInProgress = true;

    this.logToMaster("info", `Worker ${process.pid} shutting down...`);

    this.isReady = false;
    if (this.server) {
      this.server.close(async () => {
        await mongoose.connection.close();
        this.logToMaster(
          "info",
          `Worker ${process.pid} closed all connections`
        );
        process.exit(0);
      });

      setTimeout(() => {
        this.logToMaster(
          "warn",
          `Worker ${process.pid} could not close connections in time, forcing shutdown`
        );
        process.exit(1);
      }, this.options.gracefulShutdownTimeout);
    }
  }

  private exitGracefully(code: number): void {
    if (this.server) {
      this.server.close(() => {
        process.exit(code);
      });
    }
    setTimeout(() => process.exit(code), 3000);
  }

  private logToMaster(level: string, message: string, meta?: any): void {
    if (process.send) {
      process.send({
        type: "log",
        data: { level, message, meta, pid: process.pid },
      });
    } else {
      console[level === "error" ? "error" : "log"](message, meta || "");
    }
  }
}
