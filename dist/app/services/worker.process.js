"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerProcess = void 0;
const http_1 = require("http");
const mongoose_1 = __importDefault(require("mongoose"));
const Sentry = __importStar(require("@sentry/node"));
const startup_banner_1 = __importDefault(require("../lib/startup.banner"));
class WorkerProcess {
    constructor(options) {
        this.server = null;
        this.shutdownInProgress = false;
        this.isReady = false;
        this.activeConnections = 0;
        this.connectionCounter = 0;
        this.requestCounter = 0;
        this.logger = options.logger;
        this.metrics = options.metrics;
        this.options = options;
    }
    start(app, port) {
        return __awaiter(this, void 0, void 0, function* () {
            const optimizedApp = this.optimizeApp(app);
            this.server = (0, http_1.createServer)({
                keepAlive: true,
                keepAliveTimeout: 65000,
            }, optimizedApp);
            this.trackConnections(this.server);
            this.setupEventHandlers();
            this.startMonitoring();
            return new Promise((resolve) => {
                this.server.listen({ port, host: "0.0.0.0" }, () => {
                    this.isReady = true;
                    const banner = new startup_banner_1.default(this.logger, "Anti-Crime Server", "1.0.0", process.env.NODE_ENV || "development");
                    banner.displayBanner(port);
                    this.logger.info("All services initialized successfully");
                    this.logger.info("Server is ready to accept connections");
                    this.logToMaster("info", `Worker ${process.pid} is listening on port ${port}`);
                    resolve();
                });
            });
        });
    }
    optimizeApp(app) {
        app.use((req, res, next) => {
            const startTime = Date.now();
            this.requestCounter++;
            if (process.send) {
                process.send({ type: "request" });
            }
            res.on("finish", () => {
                const duration = Date.now() - startTime;
                if (duration > 1000) {
                    this.logToMaster("warn", `Slow request: ${req.method} ${req.url} took ${duration}ms`);
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
    trackConnections(server) {
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
    setupEventHandlers() {
        process.on("message", (message) => {
            if (message.type === "shutdown") {
                this.gracefulShutdown();
            }
            else if (message.type === "prepare-shutdown") {
                this.isReady = false;
                this.logToMaster("info", `Worker ${process.pid} preparing for shutdown, no longer accepting new connections`);
            }
        });
        process.on("unhandledRejection", (err) => {
            this.logToMaster("error", `Worker ${process.pid} unhandledRejection:`, err);
            if (process.env.SENTRY_DSN) {
                Sentry.captureException(err);
            }
            if (process.env.NODE_ENV !== "production") {
                this.exitGracefully(1);
            }
        });
        process.on("uncaughtException", (err) => {
            this.logToMaster("error", `Worker ${process.pid} uncaughtException:`, err);
            if (process.env.SENTRY_DSN) {
                Sentry.captureException(err);
            }
            this.exitGracefully(1);
        });
    }
    startMonitoring() {
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
            const percentUsed = ((memoryUsage.heapUsed / memoryUsage.heapTotal) *
                100).toFixed(1);
            if (heapUsedMB > heapTotalMB * 0.85) {
                this.logToMaster("warn", `Worker ${process.pid} high memory usage: ${percentUsed}% (${heapUsedMB}MB/${heapTotalMB}MB)`);
            }
            this.requestCounter = 0;
        }, 60000);
    }
    gracefulShutdown() {
        if (this.shutdownInProgress)
            return;
        this.shutdownInProgress = true;
        this.logToMaster("info", `Worker ${process.pid} shutting down...`);
        this.isReady = false;
        if (this.server) {
            this.server.close(() => __awaiter(this, void 0, void 0, function* () {
                yield mongoose_1.default.connection.close();
                this.logToMaster("info", `Worker ${process.pid} closed all connections`);
                process.exit(0);
            }));
            setTimeout(() => {
                this.logToMaster("warn", `Worker ${process.pid} could not close connections in time, forcing shutdown`);
                process.exit(1);
            }, this.options.gracefulShutdownTimeout);
        }
    }
    exitGracefully(code) {
        if (this.server) {
            this.server.close(() => {
                process.exit(code);
            });
        }
        setTimeout(() => process.exit(code), 3000);
    }
    logToMaster(level, message, meta) {
        if (process.send) {
            process.send({
                type: "log",
                data: { level, message, meta, pid: process.pid },
            });
        }
        else {
            console[level === "error" ? "error" : "log"](message, meta || "");
        }
    }
}
exports.WorkerProcess = WorkerProcess;
