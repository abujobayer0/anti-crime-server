import cluster from "cluster";
import { Worker } from "cluster";
import {
  ClusterWorker,
  MasterProcessOptions,
  WorkerMessage,
} from "../interface/server.types";

export class MasterProcess {
  private workers: Record<string, ClusterWorker> = {};
  private isShuttingDown: boolean = false;
  private totalRequests: number = 0;
  private startTime: number = Date.now();
  private metrics = {
    activeConnections: 0,
    requestsPerMinute: 0,
    lastMinuteRequests: 0,
    peakConnections: 0,
    totalErrors: 0,
  };
  private logger: any;
  private options: MasterProcessOptions;

  constructor(options: MasterProcessOptions) {
    this.options = options;
    this.logger = options.logger;
  }

  public start(): void {
    for (let i = 0; i < this.options.numCPUs; i++) {
      this.createWorker();
    }

    this.setupHealthChecks();
    this.setupClusterEvents();
    this.setupSignalHandlers();
  }

  private createWorker(): ClusterWorker {
    const worker: ClusterWorker = cluster.fork();
    this.workers[worker.id] = worker;
    worker.startTime = Date.now();

    worker.on("message", (message: WorkerMessage) =>
      this.handleWorkerMessage(worker, message)
    );

    return worker;
  }

  private handleWorkerMessage(
    worker: ClusterWorker,
    message: WorkerMessage
  ): void {
    if (!message.type) return;

    switch (message.type) {
      case "heartbeat":
        worker.lastHeartbeat = Date.now();
        if (message.data?.connections) {
          this.metrics.activeConnections += message.data.connections;
          this.metrics.peakConnections = Math.max(
            this.metrics.peakConnections,
            this.metrics.activeConnections
          );
        }
        break;
      case "log":
        if (message.data) {
          this.logger[message.data.level || "info"](
            message.data.message,
            message.data.meta
          );
        }
        break;
      case "request":
        this.totalRequests++;
        this.metrics.lastMinuteRequests++;
        break;
      case "error":
        this.metrics.totalErrors++;
        break;
    }
  }

  private setupHealthChecks(): void {
    setInterval(() => {
      this.metrics.requestsPerMinute = this.metrics.lastMinuteRequests;
      this.metrics.lastMinuteRequests = 0;

      this.logger.info(
        `Stats: ${this.metrics.requestsPerMinute} rpm, ${this.metrics.activeConnections} connections, ${this.metrics.totalErrors} errors`
      );
    }, 60000);

    setInterval(() => {
      if (this.isShuttingDown) return;

      const now: number = Date.now();
      this.metrics.activeConnections = 0;
      this.checkMemoryUsage();
      this.checkWorkerHealth(now);
    }, this.options.heartbeatInterval);
  }

  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (heapUsedPercentage > this.options.memoryThreshold) {
      this.logger.warn(
        `High memory usage detected: ${(heapUsedPercentage * 100).toFixed(2)}%`
      );
    }
  }

  private checkWorkerHealth(now: number): void {
    Object.keys(this.workers).forEach((id: string) => {
      const worker: ClusterWorker = this.workers[id];

      if (
        worker.lastHeartbeat &&
        now - worker.lastHeartbeat > this.options.heartbeatInterval * 2
      ) {
        this.logger.warn(
          `Worker ${worker.process.pid} heartbeat timeout, restarting...`
        );
        worker.kill("SIGTERM");
      }

      if (
        worker.startTime &&
        now - worker.startTime >
          this.options.workerRecycleTime + parseInt(id) * 3600000
      ) {
        this.logger.info(
          `Recycling worker ${worker.process.pid} after 24h+ uptime`
        );
        worker.send({ type: "prepare-shutdown" });

        setTimeout(() => {
          if (this.workers[id]) {
            this.workers[id].kill("SIGTERM");
          }
        }, 5000);
      }
    });
  }

  private setupClusterEvents(): void {
    cluster.on("exit", (worker: Worker, code: number, signal: string) => {
      const pid: number | undefined = worker.process.pid;
      delete this.workers[worker.id];

      if (!this.isShuttingDown) {
        const newWorker: ClusterWorker = this.createWorker();
      }
    });
  }

  private setupSignalHandlers(): void {
    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());

    process.on("uncaughtException", (err: Error) => {
      this.logger.error("Master uncaught exception:", err);
      this.gracefulShutdown();
    });

    process.on("unhandledRejection", (reason: any) => {
      this.logger.error("Master unhandled rejection:", reason);
    });
  }

  private gracefulShutdown(): void {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.logger.info(
      "Master received shutdown signal, beginning graceful shutdown..."
    );

    Object.values(this.workers).forEach((worker: ClusterWorker) => {
      worker.send({ type: "shutdown" });
    });

    setTimeout(() => {
      this.logger.info("Terminating remaining workers");
      Object.values(this.workers).forEach((worker: ClusterWorker) => {
        worker.kill("SIGTERM");
      });

      setTimeout(() => {
        this.logger.info("Master shutdown complete");
        process.exit(0);
      }, 2000);
    }, this.options.gracefulShutdownTimeout);
  }
}
