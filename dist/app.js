"use strict";
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./app/routes"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const globalErrorhandler_1 = __importDefault(require("./app/middlewares/globalErrorhandler"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("tiny"));
//parsers
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "https://anti-crime.vercel.app"],
    credentials: true,
}));
// Application routes
app.use("/api/v1", routes_1.default);
app.get("/", (req, res) => {
    res.send(`Hello Anti Crime Server on Port:${process.env.PORT}`);
});
// Health check endpoint to monitor server status
app.get("/api/status", (req, res) => {
    // Gather basic system information
    const status = {
        // Overall status of the application
        status: "ok",
        message: "Server is running normally",
        // Server identification
        server: process.env.SERVER_NAME || "unnamed-server",
        pid: process.pid,
        port: process.env.PORT,
        environment: process.env.NODE_ENV || "development",
        // Performance metrics
        uptime_seconds: Math.floor(process.uptime()),
        uptime_human: formatUptime(process.uptime()),
        current_time: new Date().toISOString(),
        // Memory usage in MB (more readable)
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
        },
        // Version and connection info
        version: process.env.npm_package_version || "unknown",
        database: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
    };
    // Log this status check to the central logger
    if (process.send) {
        process.send({
            type: "log",
            data: {
                level: "info",
                message: "Status check performed",
                meta: { source: req.ip, path: req.path },
            },
        });
    }
    // If database is disconnected, report unhealthy status
    if (mongoose_1.default.connection.readyState !== 1) {
        status.status = "error";
        status.message = "Database connection issue detected";
        return res.status(503).json(status);
    }
    // Return healthy status with 200 OK
    return res.status(200).json(status);
});
function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    let result = "";
    if (days > 0)
        result += `${days}d `;
    if (hours > 0)
        result += `${hours}h `;
    if (minutes > 0)
        result += `${minutes}m `;
    result += `${seconds}s`;
    return result;
}
app.use(globalErrorhandler_1.default);
// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound_1.default);
exports.default = app;
