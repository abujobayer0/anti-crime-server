"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Database Indexing Module
 * Handles the creation and management of database indexes for optimal query performance
 * @module DatabaseIndexing
 */
class DatabaseIndexingService {
    /**
     * Creates indexes for the User collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createUserIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating User collection indexes");
                const UserModel = (yield Promise.resolve().then(() => __importStar(require("./Auth/auth.model")))).default;
                yield Promise.all([
                    UserModel.collection.createIndex({ email: 1 }, {
                        unique: true,
                        name: "email_unique_idx",
                        background: true,
                    }),
                    UserModel.collection.createIndex({ name: 1 }, {
                        name: "name_idx",
                        background: true,
                    }),
                    UserModel.collection.createIndex({ role: 1, isBanned: 1 }, {
                        name: "role_banned_compound_idx",
                        background: true,
                    }),
                ]);
                this.logger.info("User collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating User indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Creates indexes for the CrimeReport collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createCrimeReportIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating CrimeReport collection indexes");
                const { CrimeReport } = yield Promise.resolve().then(() => __importStar(require("./CrimeReport/crimeReport.model")));
                yield Promise.all([
                    CrimeReport.collection.createIndex({ location: "2dsphere" }, {
                        name: "location_geo_idx",
                        background: true,
                    }),
                    CrimeReport.collection.createIndex({ createdAt: -1 }, {
                        name: "created_at_desc_idx",
                        background: true,
                    }),
                    CrimeReport.collection.createIndex({ status: 1, crimeType: 1 }, {
                        name: "status_crimeType_compound_idx",
                        background: true,
                    }),
                    CrimeReport.collection.createIndex({
                        title: "text",
                        description: "text",
                    }, {
                        name: "fulltext_search_idx",
                        background: true,
                        weights: {
                            title: 10,
                            description: 5,
                        },
                    }),
                ]);
                this.logger.info("CrimeReport collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating CrimeReport indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Creates indexes for the Comment collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createCommentIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating Comment collection indexes");
                const { Comment } = yield Promise.resolve().then(() => __importStar(require("./Comment/comment.model")));
                yield Promise.all([
                    Comment.collection.createIndex({ reportId: 1 }, {
                        name: "reportId_idx",
                        background: true,
                    }),
                    Comment.collection.createIndex({ userId: 1, createdAt: -1 }, {
                        name: "userId_createdAt_compound_idx",
                        background: true,
                    }),
                    Comment.collection.createIndex({ replyTo: 1 }, {
                        name: "replyTo_idx",
                        background: true,
                        sparse: true,
                    }),
                ]);
                this.logger.info("Comment collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating Comment indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Creates indexes for the Notification collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createNotificationIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating Notification collection indexes");
                const Notification = (yield Promise.resolve().then(() => __importStar(require("./Notification/notification.model"))))
                    .default;
                yield Promise.all([
                    Notification.collection.createIndex({ recipient: 1, createdAt: -1 }, {
                        name: "recipient_createdAt_compound_idx",
                        background: true,
                    }),
                    Notification.collection.createIndex({ recipient: 1, isRead: 1 }, {
                        name: "recipient_isRead_compound_idx",
                        background: true,
                    }),
                    Notification.collection.createIndex({ type: 1 }, {
                        name: "type_idx",
                        background: true,
                    }),
                    Notification.collection.createIndex({
                        recipient: 1,
                        isRead: 1,
                        type: 1,
                    }, {
                        name: "recipient_isRead_type_compound_idx",
                        background: true,
                    }),
                ]);
                this.logger.info("Notification collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating Notification indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Creates indexes for the Followers collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createFollowersIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating Followers collection indexes");
                const { Followers } = yield Promise.resolve().then(() => __importStar(require("./Followers/followers.model")));
                yield Promise.all([
                    Followers.collection.createIndex({ userId: 1 }, {
                        name: "userId_idx",
                        background: true,
                    }),
                    Followers.collection.createIndex({ userId: 1, following: 1 }, {
                        name: "userId_following_compound_idx",
                        background: true,
                    }),
                    Followers.collection.createIndex({ userId: 1, followers: 1 }, {
                        name: "userId_followers_compound_idx",
                        background: true,
                    }),
                ]);
                this.logger.info("Followers collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating Followers indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Creates indexes for the Bookmark collection
     * @returns Promise resolving when indexes are created
     * @throws Error if index creation fails
     */
    static createBookmarkIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Creating Bookmark collection indexes");
                const { Bookmark } = yield Promise.resolve().then(() => __importStar(require("./Bookmark/bookmark.model")));
                yield Promise.all([
                    Bookmark.collection.createIndex({ userId: 1, reportId: 1 }, {
                        name: "userId_reportId_unique_idx",
                        background: true,
                        unique: true,
                    }),
                    Bookmark.collection.createIndex({ userId: 1, createdAt: -1 }, {
                        name: "userId_createdAt_idx",
                        background: true,
                    }),
                ]);
                this.logger.info("Bookmark collection indexes created successfully");
            }
            catch (error) {
                this.logger.error(`Error creating Bookmark indexes: ${error.message}`, error);
                throw error;
            }
        });
    }
    /**
     * Initializes all database indexes
     * @returns Promise resolving when all indexes are created
     */
    static initializeIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("Starting database indexes initialization");
            try {
                yield this.createUserIndexes();
                yield this.createCrimeReportIndexes();
                yield this.createCommentIndexes();
                yield this.createNotificationIndexes();
                yield this.createFollowersIndexes();
                yield this.createBookmarkIndexes();
                this.logger.info("All database indexes created successfully");
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Verifies that all required indexes exist in the database
     * @returns Promise resolving to a boolean indicating if all indexes exist
     */
    static verifyIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("Verifying database indexes");
            try {
                const UserModel = (yield Promise.resolve().then(() => __importStar(require("./Auth/auth.model")))).default;
                const userIndexes = yield UserModel.collection.indexes();
                const { CrimeReport } = yield Promise.resolve().then(() => __importStar(require("./CrimeReport/crimeReport.model")));
                const crimeReportIndexes = yield CrimeReport.collection.indexes();
                const allIndexesExist = userIndexes.length >= 3 && crimeReportIndexes.length >= 4;
                if (allIndexesExist) {
                    this.logger.info("All required database indexes verified successfully");
                }
                else {
                    this.logger.warn("Some database indexes are missing");
                }
                return allIndexesExist;
            }
            catch (error) {
                this.logger.error(`Error verifying indexes: ${error.message}`, error);
                return false;
            }
        });
    }
}
DatabaseIndexingService.logger = new logger_1.default("DatabaseIndexingService");
/**
 * Initialize all database indexes
 * @returns Promise resolving when all indexes are created
 */
const initializeIndexes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield DatabaseIndexingService.initializeIndexes();
    }
    catch (error) {
        console.error("Error initializing database indexes:", error.message);
    }
});
exports.default = initializeIndexes;
