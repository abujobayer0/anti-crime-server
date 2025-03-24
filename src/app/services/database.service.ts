import mongoose from "mongoose";
import {
  ConnectionOptions,
  DatabaseServiceOptions,
} from "../interface/server.types";

export class DatabaseService {
  private logger: any;
  private dbUrl: string;
  private maxRetries: number;

  constructor(options: DatabaseServiceOptions) {
    this.logger = options.logger;
    this.dbUrl = options.dbUrl;
    this.maxRetries = options.maxRetries;
  }

  public async connectWithRetry(): Promise<boolean> {
    let retries: number = 0;

    while (retries < this.maxRetries) {
      try {
        const options: ConnectionOptions = {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 50,
          minPoolSize: 5,
        };

        await mongoose.connect(this.dbUrl, options);
        this.logToMaster("info", `Worker ${process.pid} connected to database`);

        this.setupDatabaseListeners();
        mongoose.set("autoIndex", false);

        return true;
      } catch (err: any) {
        retries++;
        this.logToMaster(
          "warn",
          `Database connection attempt ${retries}/${this.maxRetries} failed: ${err.message}`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries))
        );
      }
    }

    this.logToMaster(
      "error",
      `Worker ${process.pid} failed to connect to database after ${this.maxRetries} attempts`
    );
    return false;
  }

  private setupDatabaseListeners(): void {
    mongoose.connection.on("error", (err) => {
      this.logToMaster("error", `Worker ${process.pid} MongoDB error:`, err);
      // Only exit if we're not already shutting down
      if (!process.env.SHUTDOWN_IN_PROGRESS) {
        process.exit(1);
      }
    });
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
