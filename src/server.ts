import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { seed } from "./app/utils/seedingAdmin";
import redisService from "./config/redis";
let server: Server;

async function main() {
  try {
    await mongoose.connect(config.DATABASE_URL as string);
    await redisService.connect();
    server = app.listen(config.port, () => {
      console.log(`app is listening on port ${config.port}`);
    });

    // seeding admin
    seed();
  } catch (err) {
    console.log(err);
  }
}

main();

process.on("unhandledRejection", (err) => {
  console.log(`😈 unhandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
