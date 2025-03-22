import winston from "winston";
import { format, Logger as WinstonLogger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "../../config";

/**
 * Available log levels
 */
type LogLevel = "error" | "warn" | "info" | "http" | "debug";

/**
 * Custom log levels configuration
 */
const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Log metadata interface
 */
interface LogMetadata {
  [key: string]: any;
}

/**
 * Configuration interface
 */
interface LoggerConfig {
  NODE_ENV?: string;
}

/**
 * Determine the appropriate log level based on environment
 */
const level = (): LogLevel => {
  const env: string = (config as LoggerConfig).NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

/**
 * Custom color scheme for console output
 */
const colors: Record<LogLevel, string> = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Add colors to Winston
winston.addColors(colors);

/**
 * Log information interface
 */
interface LogInfo {
  timestamp?: string;
  level: string;
  message: string;
  metadata: {
    service?: string;
    [key: string]: any;
  };
  stack?: string;
}

/**
 * Custom format for log messages
 */
const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.errors({ stack: true }),
  format.metadata(),
  format.printf((info: any) => {
    const { timestamp, level, message, metadata, stack } = info;
    const { service, ...meta } = metadata;

    // Format message with timestamp, level, service name, and message
    let log = `${timestamp} [${level.toUpperCase()}] [${service}]: ${message}`;

    // Add metadata if available (excluding service name to avoid duplication)
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

/**
 * Console format with colors for development
 */
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  customFormat
);

/**
 * File transport options interface
 */
interface RotateFileOptions {
  level?: LogLevel;
  filename: string;
  datePattern: string;
  maxSize: string;
  maxFiles: string;
  zippedArchive: boolean;
}

/**
 * File transport for daily log rotation
 */
const fileRotateTransport = new DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
} as RotateFileOptions);

/**
 * Error file transport for daily log rotation
 */
const errorFileRotateTransport = new DailyRotateFile({
  level: "error",
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "30d",
  zippedArchive: true,
} as RotateFileOptions);

/**
 * Create transports array based on environment
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    // Always log to console
    new winston.transports.Console({ format: consoleFormat }),
  ];

  // Add file transports in production
  if ((config as LoggerConfig).NODE_ENV === "production") {
    transports.push(fileRotateTransport);
    transports.push(errorFileRotateTransport);
  }

  return transports;
};

/**
 * Create the Winston logger instance
 */
const createLogger = (): WinstonLogger => {
  return winston.createLogger({
    level: level(),
    levels,
    format: customFormat,
    transports: getTransports(),
    exitOnError: false,
  });
};

// Create the base logger instance
const baseLogger: WinstonLogger = createLogger();

/**
 * Logger class for application-wide logging
 */
export class Logger {
  private service: string;
  private logger: WinstonLogger;

  /**
   * Creates a new logger instance for a specific service
   * @param service - The name of the service using this logger
   */
  constructor(service: string) {
    this.service = service;
    this.logger = baseLogger;
  }

  /**
   * Log an error message
   * @param message - The error message
   * @param meta - Additional metadata
   */
  error(message: string, meta: LogMetadata = {}): void {
    this.logger.error(message, { service: this.service, ...meta });
  }

  /**
   * Log a warning message
   * @param message - The warning message
   * @param meta - Additional metadata
   */
  warn(message: string, meta: LogMetadata = {}): void {
    this.logger.warn(message, { service: this.service, ...meta });
  }

  /**
   * Log an informational message
   * @param message - The info message
   * @param meta - Additional metadata
   */
  info(message: string, meta: LogMetadata = {}): void {
    this.logger.info(message, { service: this.service, ...meta });
  }

  /**
   * Log an HTTP request
   * @param message - The HTTP request message
   * @param meta - Additional metadata
   */
  http(message: string, meta: LogMetadata = {}): void {
    this.logger.http(message, { service: this.service, ...meta });
  }

  /**
   * Log a debug message
   * @param message - The debug message
   * @param meta - Additional metadata
   */
  debug(message: string, meta: LogMetadata = {}): void {
    this.logger.debug(message, { service: this.service, ...meta });
  }
}

/**
 * Handle and log uncaught exceptions
 */
process.on("uncaughtException", (error: Error) => {
  baseLogger.error("Uncaught Exception", { error });
  // Give time for logs to be written before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Handle and log unhandled promise rejections
 */
process.on("unhandledRejection", (error: Error | any) => {
  baseLogger.error("Unhandled Rejection", { error });
});

export default Logger;
