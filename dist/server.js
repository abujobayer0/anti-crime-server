"use strict";
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
const cluster_1 = __importDefault(require("cluster"));
const os_1 = require("os");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const seedingAdmin_1 = require("./app/utils/seedingAdmin");
const module_1 = __importDefault(require("./app/module"));
const logger_1 = __importDefault(require("./app/utils/logger"));
const master_process_1 = require("./app/services/master.process");
const sentry_service_1 = require("./app/services/sentry.service");
const server_metrics_1 = require("./app/services/server.metrics");
const worker_process_1 = require("./app/services/worker.process");
const database_service_1 = require("./app/services/database.service");
const CONSTANTS = {
    NUM_CPUS: Math.max(1, (0, os_1.cpus)().length - 1),
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    GRACEFUL_SHUTDOWN_TIMEOUT: 15000, // 15 seconds
    DB_MAX_RETRIES: 7,
    MEMORY_THRESHOLD: 0.9, // 90% memory usage threshold
    WORKER_RECYCLE_TIME: 86400000, // 24 hours
};
const logger = new logger_1.default("Server");
sentry_service_1.SentryService.initialize(config_1.default.SENTRY_DSN, config_1.default.NODE_ENV);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cluster_1.default.isPrimary) {
            runMasterProcess();
        }
        else {
            yield runWorkerProcess();
        }
    });
}
function runMasterProcess() {
    logger.info(`Master process ${process.pid} is running on ${CONSTANTS.NUM_CPUS} cores`);
    const masterProcess = new master_process_1.MasterProcess({
        logger,
        numCPUs: CONSTANTS.NUM_CPUS,
        heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL,
        gracefulShutdownTimeout: CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT,
        memoryThreshold: CONSTANTS.MEMORY_THRESHOLD,
        workerRecycleTime: CONSTANTS.WORKER_RECYCLE_TIME,
    });
    masterProcess.start();
}
function runWorkerProcess() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const metrics = new server_metrics_1.ServerMetrics();
        const workerProcess = new worker_process_1.WorkerProcess({
            logger,
            metrics,
            gracefulShutdownTimeout: CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT,
            heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL,
        });
        try {
            const dbService = new database_service_1.DatabaseService({
                logger,
                dbUrl: config_1.default.DATABASE_URL,
                maxRetries: CONSTANTS.DB_MAX_RETRIES,
            });
            const connected = yield dbService.connectWithRetry();
            if (!connected) {
                process.exit(1);
                return;
            }
            if (((_a = cluster_1.default.worker) === null || _a === void 0 ? void 0 : _a.id) === 1) {
                yield (0, module_1.default)();
                logger.info("Database indexes verified by worker 1");
                yield (0, seedingAdmin_1.seed)();
                logger.info("Admin seeding completed by worker 1");
            }
            yield workerProcess.start(app_1.default, config_1.default.port);
        }
        catch (err) {
            logger.error(`Worker startup error: ${err.message}`, err);
            process.exit(1);
        }
    });
}
main().catch((err) => {
    logger.error("Fatal error starting server:", err);
    process.exit(1);
});
