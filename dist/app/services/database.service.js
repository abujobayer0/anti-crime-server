"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class DatabaseService {
    constructor(options) {
        this.logger = options.logger;
        this.dbUrl = options.dbUrl;
        this.maxRetries = options.maxRetries;
    }
    connectWithRetry() {
        return __awaiter(this, void 0, void 0, function* () {
            let retries = 0;
            while (retries < this.maxRetries) {
                try {
                    const options = {
                        serverSelectionTimeoutMS: 5000,
                        connectTimeoutMS: 10000,
                        socketTimeoutMS: 45000,
                        maxPoolSize: 50,
                        minPoolSize: 5,
                    };
                    yield mongoose_1.default.connect(this.dbUrl, options);
                    this.logToMaster("info", `Worker ${process.pid} connected to database`);
                    this.setupDatabaseListeners();
                    mongoose_1.default.set("autoIndex", false);
                    return true;
                }
                catch (err) {
                    retries++;
                    this.logToMaster("warn", `Database connection attempt ${retries}/${this.maxRetries} failed: ${err.message}`);
                    yield new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
                }
            }
            this.logToMaster("error", `Worker ${process.pid} failed to connect to database after ${this.maxRetries} attempts`);
            return false;
        });
    }
    setupDatabaseListeners() {
        mongoose_1.default.connection.on("error", (err) => {
            this.logToMaster("error", `Worker ${process.pid} MongoDB error:`, err);
            // Only exit if we're not already shutting down
            if (!process.env.SHUTDOWN_IN_PROGRESS) {
                process.exit(1);
            }
        });
    }
    logToMaster(level, message, meta) {
        if (process.send) {
            process.send({
                type: "log",
                data: { level, message, meta, pid: process.pid },
            });
        }
        else {
            console[level === "error" ? "error" : "log"](message, meta || "");
        }
    }
}
exports.DatabaseService = DatabaseService;
