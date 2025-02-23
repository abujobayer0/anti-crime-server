import { Request, Response, NextFunction } from "express";
import redisService from "../../config/redis";
import catchAsync from "../utils/catchAsync";

interface CacheOptions {
  duration?: number;
  keyPrefix?: string;
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const duration = options.duration || 3600;
    const keyPrefix = options.keyPrefix || "cache";
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    const cachedData = await redisService.getCache(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const originalJson = res.json;
    res.json = function (data) {
      redisService.setCacheWithExpiry(cacheKey, data, duration);
      return originalJson.call(this, data);
    };

    next();
  });
};

export const clearCache = (keyPrefix: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await redisService.clearCache(keyPrefix);
    next();
  };
};
