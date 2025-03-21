/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import globalErrorHandler from "./app/middlewares/globalErrorhandler";
import morgan from "morgan";
import mongoose from "mongoose";

const app: Application = express();
app.use(morgan("tiny"));

//parsers
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://anti-crime.vercel.app"],
    credentials: true,
  })
);

// Application routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
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
      heapUsed:
        Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      heapTotal:
        Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
    },

    // Version and connection info
    version: process.env.npm_package_version || "unknown",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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
  if (mongoose.connection.readyState !== 1) {
    status.status = "error";
    status.message = "Database connection issue detected";
    return res.status(503).json(status);
  }

  // Return healthy status with 200 OK
  return res.status(200).json(status);
});

function formatUptime(uptime: number) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result;
}

app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
