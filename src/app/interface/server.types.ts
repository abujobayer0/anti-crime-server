import { Worker } from "cluster";
import mongoose from "mongoose";

export interface WorkerMessage {
  type: string;
  pid?: number;
  data?: any;
}

export interface ClusterWorker extends Worker {
  lastHeartbeat?: number;
  startTime?: number;
}

export interface MetricsData {
  activeConnections: number;
  requestsPerMinute: number;
  lastMinuteRequests: number;
  peakConnections: number;
  totalErrors: number;
}

export interface ConnectionOptions extends mongoose.ConnectOptions {
  serverSelectionTimeoutMS: number;
  connectTimeoutMS: number;
  maxPoolSize: number;
  minPoolSize: number;
  socketTimeoutMS: number;
}

export interface MasterProcessOptions {
  logger: any;
  numCPUs: number;
  heartbeatInterval: number;
  gracefulShutdownTimeout: number;
  memoryThreshold: number;
  workerRecycleTime: number;
}

export interface WorkerProcessOptions {
  logger: any;
  metrics: any;
  gracefulShutdownTimeout: number;
  heartbeatInterval: number;
}

export interface DatabaseServiceOptions {
  logger: any;
  dbUrl: string;
  maxRetries: number;
}
