"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const config_1 = __importDefault(require("../../config"));
/**
 * Custom log levels configuration
 */
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
/**
 * Determine the appropriate log level based on environment
 */
const level = () => {
    const env = config_1.default.NODE_ENV || "development";
    return env === "development" ? "debug" : "info";
};
/**
 * Custom color scheme for console output
 */
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};
// Add colors to Winston
winston_1.default.addColors(colors);
/**
 * Custom format for log messages
 */
const customFormat = winston_2.format.combine(winston_2.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }), winston_2.format.errors({ stack: true }), winston_2.format.metadata(), winston_2.format.printf((info) => {
    const { timestamp, level, message, metadata, stack } = info;
    const { service } = metadata, meta = __rest(metadata, ["service"]);
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
}));
/**
 * Console format with colors for development
 */
const consoleFormat = winston_2.format.combine(winston_2.format.colorize({ all: true }), customFormat);
/**
 * File transport for daily log rotation
 */
const fileRotateTransport = new winston_daily_rotate_file_1.default({
    filename: "logs/application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    zippedArchive: true,
});
/**
 * Error file transport for daily log rotation
 */
const errorFileRotateTransport = new winston_daily_rotate_file_1.default({
    level: "error",
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    zippedArchive: true,
});
/**
 * Create transports array based on environment
 */
const getTransports = () => {
    const transports = [
        // Always log to console
        new winston_1.default.transports.Console({ format: consoleFormat }),
    ];
    // Add file transports in production
    if (config_1.default.NODE_ENV === "production") {
        transports.push(fileRotateTransport);
        transports.push(errorFileRotateTransport);
    }
    return transports;
};
/**
 * Create the Winston logger instance
 */
const createLogger = () => {
    return winston_1.default.createLogger({
        level: level(),
        levels,
        format: customFormat,
        transports: getTransports(),
        exitOnError: false,
    });
};
// Create the base logger instance
const baseLogger = createLogger();
/**
 * Logger class for application-wide logging
 */
class Logger {
    /**
     * Creates a new logger instance for a specific service
     * @param service - The name of the service using this logger
     */
    constructor(service) {
        this.service = service;
        this.logger = baseLogger;
    }
    /**
     * Log an error message
     * @param message - The error message
     * @param meta - Additional metadata
     */
    error(message, meta = {}) {
        this.logger.error(message, Object.assign({ service: this.service }, meta));
    }
    /**
     * Log a warning message
     * @param message - The warning message
     * @param meta - Additional metadata
     */
    warn(message, meta = {}) {
        this.logger.warn(message, Object.assign({ service: this.service }, meta));
    }
    /**
     * Log an informational message
     * @param message - The info message
     * @param meta - Additional metadata
     */
    info(message, meta = {}) {
        this.logger.info(message, Object.assign({ service: this.service }, meta));
    }
    /**
     * Log an HTTP request
     * @param message - The HTTP request message
     * @param meta - Additional metadata
     */
    http(message, meta = {}) {
        this.logger.http(message, Object.assign({ service: this.service }, meta));
    }
    /**
     * Log a debug message
     * @param message - The debug message
     * @param meta - Additional metadata
     */
    debug(message, meta = {}) {
        this.logger.debug(message, Object.assign({ service: this.service }, meta));
    }
}
exports.Logger = Logger;
/**
 * Handle and log uncaught exceptions
 */
process.on("uncaughtException", (error) => {
    baseLogger.error("Uncaught Exception", { error });
    // Give time for logs to be written before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
/**
 * Handle and log unhandled promise rejections
 */
process.on("unhandledRejection", (error) => {
    baseLogger.error("Unhandled Rejection", { error });
});
exports.default = Logger;
