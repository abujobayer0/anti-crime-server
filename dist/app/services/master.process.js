"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterProcess = void 0;
const cluster_1 = __importDefault(require("cluster"));
class MasterProcess {
    constructor(options) {
        this.workers = {};
        this.isShuttingDown = false;
        this.totalRequests = 0;
        this.startTime = Date.now();
        this.metrics = {
            activeConnections: 0,
            requestsPerMinute: 0,
            lastMinuteRequests: 0,
            peakConnections: 0,
            totalErrors: 0,
        };
        this.options = options;
        this.logger = options.logger;
    }
    start() {
        for (let i = 0; i < this.options.numCPUs; i++) {
            this.createWorker();
        }
        this.setupHealthChecks();
        this.setupClusterEvents();
        this.setupSignalHandlers();
    }
    createWorker() {
        const worker = cluster_1.default.fork();
        this.workers[worker.id] = worker;
        worker.startTime = Date.now();
        worker.on("message", (message) => this.handleWorkerMessage(worker, message));
        return worker;
    }
    handleWorkerMessage(worker, message) {
        var _a;
        if (!message.type)
            return;
        switch (message.type) {
            case "heartbeat":
                worker.lastHeartbeat = Date.now();
                if ((_a = message.data) === null || _a === void 0 ? void 0 : _a.connections) {
                    this.metrics.activeConnections += message.data.connections;
                    this.metrics.peakConnections = Math.max(this.metrics.peakConnections, this.metrics.activeConnections);
                }
                break;
            case "log":
                if (message.data) {
                    this.logger[message.data.level || "info"](message.data.message, message.data.meta);
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
    setupHealthChecks() {
        setInterval(() => {
            this.metrics.requestsPerMinute = this.metrics.lastMinuteRequests;
            this.metrics.lastMinuteRequests = 0;
            this.logger.info(`Stats: ${this.metrics.requestsPerMinute} rpm, ${this.metrics.activeConnections} connections, ${this.metrics.totalErrors} errors`);
        }, 60000);
        setInterval(() => {
            if (this.isShuttingDown)
                return;
            const now = Date.now();
            this.metrics.activeConnections = 0;
            this.checkMemoryUsage();
            this.checkWorkerHealth(now);
        }, this.options.heartbeatInterval);
    }
    checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;
        if (heapUsedPercentage > this.options.memoryThreshold) {
            this.logger.warn(`High memory usage detected: ${(heapUsedPercentage * 100).toFixed(2)}%`);
        }
    }
    checkWorkerHealth(now) {
        Object.keys(this.workers).forEach((id) => {
            const worker = this.workers[id];
            if (worker.lastHeartbeat &&
                now - worker.lastHeartbeat > this.options.heartbeatInterval * 2) {
                this.logger.warn(`Worker ${worker.process.pid} heartbeat timeout, restarting...`);
                worker.kill("SIGTERM");
            }
            if (worker.startTime &&
                now - worker.startTime >
                    this.options.workerRecycleTime + parseInt(id) * 3600000) {
                this.logger.info(`Recycling worker ${worker.process.pid} after 24h+ uptime`);
                worker.send({ type: "prepare-shutdown" });
                setTimeout(() => {
                    if (this.workers[id]) {
                        this.workers[id].kill("SIGTERM");
                    }
                }, 5000);
            }
        });
    }
    setupClusterEvents() {
        cluster_1.default.on("exit", (worker, code, signal) => {
            const pid = worker.process.pid;
            delete this.workers[worker.id];
            if (!this.isShuttingDown) {
                const newWorker = this.createWorker();
            }
        });
    }
    setupSignalHandlers() {
        process.on("SIGTERM", () => this.gracefulShutdown());
        process.on("SIGINT", () => this.gracefulShutdown());
        process.on("uncaughtException", (err) => {
            this.logger.error("Master uncaught exception:", err);
            this.gracefulShutdown();
        });
        process.on("unhandledRejection", (reason) => {
            this.logger.error("Master unhandled rejection:", reason);
        });
    }
    gracefulShutdown() {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        this.logger.info("Master received shutdown signal, beginning graceful shutdown...");
        Object.values(this.workers).forEach((worker) => {
            worker.send({ type: "shutdown" });
        });
        setTimeout(() => {
            this.logger.info("Terminating remaining workers");
            Object.values(this.workers).forEach((worker) => {
                worker.kill("SIGTERM");
            });
            setTimeout(() => {
                this.logger.info("Master shutdown complete");
                process.exit(0);
            }, 2000);
        }, this.options.gracefulShutdownTimeout);
    }
}
exports.MasterProcess = MasterProcess;
