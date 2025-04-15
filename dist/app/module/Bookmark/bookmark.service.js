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
exports.BookmarkService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const auth_model_1 = __importDefault(require("../Auth/auth.model"));
const bookmark_model_1 = require("./bookmark.model");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Service class for handling bookmark-related operations
 * @class BookmarkService
 */
class BookmarkService {
    /**
     * Creates a new bookmark for a report
     * @param reportId - The ID of the report to bookmark
     * @param userId - The ID of the user creating the bookmark
     * @returns Promise resolving to the created bookmark or null
     * @throws AppError if the user is not found or bookmark already exists
     */
    static createBookmark(reportId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Creating bookmark for report ${reportId} by user ${userId}`);
                if (!reportId || !userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID and User ID are required");
                }
                const existingBookmark = yield bookmark_model_1.Bookmark.findOne({ userId, reportId });
                if (existingBookmark) {
                    this.logger.warn(`Bookmark already exists for report ${reportId} by user ${userId}`);
                    throw new AppError_1.default(http_status_1.default.CONFLICT, "Bookmark already exists for this report");
                }
                const user = yield auth_model_1.default.findById(userId).select("_id");
                if (!user) {
                    this.logger.error(`User ${userId} not found when creating bookmark`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                const createdBookmark = yield bookmark_model_1.Bookmark.create({
                    userId,
                    reportId,
                });
                this.logger.info(`Successfully created bookmark ${createdBookmark._id}`);
                return createdBookmark;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error creating bookmark: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create bookmark");
            }
        });
    }
    /**
     * Retrieves all bookmarks for a specific user
     * @param userId - The ID of the user
     * @returns Promise resolving to an array of bookmarks or empty array if none found
     * @throws AppError if there's an error during retrieval
     */
    static getBookmarksByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Retrieving bookmarks for user ${userId}`);
                if (!userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const bookmarks = yield bookmark_model_1.Bookmark.find({ userId })
                    .populate("reportId")
                    .sort({ createdAt: -1 });
                this.logger.info(`Retrieved ${bookmarks.length} bookmarks for user ${userId}`);
                return bookmarks;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error retrieving bookmarks: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve bookmarks");
            }
        });
    }
    /**
     * Deletes a bookmark by its ID
     * @param bookmarkId - The ID of the bookmark to delete
     * @param userId - The ID of the user requesting deletion (for authorization)
     * @returns Promise resolving to the deleted bookmark or null if not found
     * @throws AppError if bookmark not found or user not authorized
     */
    static deleteBookmarkById(bookmarkId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Deleting bookmark ${bookmarkId} by user ${userId}`);
                if (!bookmarkId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Bookmark ID is required");
                }
                const bookmark = yield bookmark_model_1.Bookmark.findById(bookmarkId);
                if (!bookmark) {
                    this.logger.warn(`Bookmark ${bookmarkId} not found for deletion`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Bookmark not found");
                }
                if (bookmark.userId.toString() !== userId) {
                    this.logger.warn(`User ${userId} not authorized to delete bookmark ${bookmarkId}`);
                    throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Not authorized to delete this bookmark");
                }
                const deletedBookmark = yield bookmark_model_1.Bookmark.findByIdAndDelete(bookmarkId);
                this.logger.info(`Successfully deleted bookmark ${bookmarkId}`);
                return deletedBookmark;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error deleting bookmark: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete bookmark");
            }
        });
    }
    /**
     * Checks if a user has bookmarked a specific report
     * @param reportId - The ID of the report
     * @param userId - The ID of the user
     * @returns Promise resolving to a boolean indicating if the report is bookmarked
     */
    static isReportBookmarked(reportId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Checking if report ${reportId} is bookmarked by user ${userId}`);
                if (!reportId || !userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID and User ID are required");
                }
                const bookmark = yield bookmark_model_1.Bookmark.findOne({ userId, reportId });
                return !!bookmark;
            }
            catch (error) {
                this.logger.error(`Error checking bookmark status: ${error.message}`, error);
                return false;
            }
        });
    }
}
exports.BookmarkService = BookmarkService;
BookmarkService.logger = new logger_1.default("BookmarkService");
