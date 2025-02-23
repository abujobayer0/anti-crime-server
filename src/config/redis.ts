import { createClient, RedisClientType } from "redis";
import { config } from "dotenv";
import AppError from "../app/errors/AppError";
import httpStatus from "http-status";

config();

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly retryAttempts: number = 3;
  private readonly retryDelay: number = 1000; // ms

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.client) return;

    try {
      this.client = createClient({
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT || "6379"),
        },
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("✅ Redis Client Connected");
        this.isConnected = true;
      });

      await this.retryConnection();
    } catch (error) {
      console.error("❌ Redis initialization failed:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Redis initialization failed"
      );
    }
  }

  private async retryConnection(): Promise<void> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        if (this.client) {
          await this.client.connect();
          return;
        }
      } catch (error) {
        console.error(
          `🔁 Redis Retry Attempt ${attempt}/${this.retryAttempts}:`,
          error
        );
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        } else {
          throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Redis connection retry attempts exceeded"
          );
        }
      }
    }
  }

  async setCacheWithExpiry<T>(
    key: string,
    value: T,
    expirySeconds = 3600
  ): Promise<boolean> {
    if (!this.client) throw new Error("Redis client not initialized");
    try {
      await this.client.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("❌ Cache set error:", error);
      return false;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    if (!this.client) throw new Error("Redis client not initialized");
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error("❌ Cache get error:", error);
      return null;
    }
  }

  async clearCache(pattern: string): Promise<boolean> {
    if (!this.client) throw new Error("Redis client not initialized");
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error("❌ Cache clear error:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log("🛑 Redis Client Disconnected");
    }
  }

  public async connect(): Promise<void> {
    await this.initialize();
  }
}

// Singleton instance
const redisService = new RedisService();
export default redisService;
