import cluster from "cluster";
import { cpus } from "os";
import app from "./app";
import config from "./config";
import { seed } from "./app/utils/seedingAdmin";
import initializeIndexes from "./app/module";
import Logger from "./app/utils/logger";
import { MasterProcess } from "./app/services/master.process";
import { SentryService } from "./app/services/sentry.service";
import { ServerMetrics } from "./app/services/server.metrics";
import { WorkerProcess } from "./app/services/worker.process";
import { DatabaseService } from "./app/services/database.service";

const CONSTANTS = {
  NUM_CPUS: Math.max(1, cpus().length - 1),
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  GRACEFUL_SHUTDOWN_TIMEOUT: 15000, // 15 seconds
  DB_MAX_RETRIES: 7,
  MEMORY_THRESHOLD: 0.9, // 90% memory usage threshold
  WORKER_RECYCLE_TIME: 86400000, // 24 hours
};

const logger = new Logger("Server");

SentryService.initialize(config.SENTRY_DSN, config.NODE_ENV);

async function main() {
  if (cluster.isPrimary) {
    runMasterProcess();
  } else {
    await runWorkerProcess();
  }
}

function runMasterProcess() {
  logger.info(
    `Master process ${process.pid} is running on ${CONSTANTS.NUM_CPUS} cores`
  );

  const masterProcess = new MasterProcess({
    logger,
    numCPUs: CONSTANTS.NUM_CPUS,
    heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL,
    gracefulShutdownTimeout: CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT,
    memoryThreshold: CONSTANTS.MEMORY_THRESHOLD,
    workerRecycleTime: CONSTANTS.WORKER_RECYCLE_TIME,
  });

  masterProcess.start();
}

async function runWorkerProcess() {
  const metrics = new ServerMetrics();
  const workerProcess = new WorkerProcess({
    logger,
    metrics,
    gracefulShutdownTimeout: CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT,
    heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL,
  });

  try {
    const dbService = new DatabaseService({
      logger,
      dbUrl: config.DATABASE_URL!,
      maxRetries: CONSTANTS.DB_MAX_RETRIES,
    });

    const connected = await dbService.connectWithRetry();
    if (!connected) {
      process.exit(1);
      return;
    }

    if (cluster.worker?.id === 1) {
      await initializeIndexes();
      logger.info("Database indexes verified by worker 1");

      await seed();
      logger.info("Admin seeding completed by worker 1");
    }

    await workerProcess.start(app, config.port);
  } catch (err: any) {
    logger.error(`Worker startup error: ${err.message}`, err);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error("Fatal error starting server:", err);
  process.exit(1);
});
