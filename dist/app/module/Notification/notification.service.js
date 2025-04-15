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
const notification_model_1 = __importDefault(require("./notification.model"));
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../utils/logger"));
class NotificationService {
    constructor() {
        this.logger = new logger_1.default("NotificationService");
    }
    /**
     * Creates a new notification
     * @param data Notification data
     * @returns Created notification
     */
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug("Creating notification", {
                recipient: data.recipient,
                type: data.type,
            });
            if (!data.recipient ||
                !data.sender ||
                !data.type ||
                !data.title ||
                !data.message) {
                throw new Error("Missing required notification fields");
            }
            const session = yield (0, mongoose_1.startSession)();
            try {
                session.startTransaction();
                const notification = yield notification_model_1.default.create([
                    Object.assign(Object.assign({}, data), { recipient: data.recipient, sender: data.sender, relatedReport: data.relatedReport || null, relatedComment: data.relatedComment || null, isRead: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() }),
                ], { session });
                yield session.commitTransaction();
                this.logger.info("Notification created successfully", {
                    id: notification[0]._id,
                });
                return notification[0];
            }
            catch (error) {
                yield session.abortTransaction();
                this.logger.error("Failed to create notification", { error, data });
                throw new Error("Failed to create notification");
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Retrieves notifications for a user with pagination
     * @param userId User ID
     * @param options Pagination options
     * @returns List of notifications and count
     */
    getNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            try {
                this.logger.debug("Fetching notifications", { userId, options });
                if (!userId) {
                    throw new Error("User ID is required");
                }
                const page = options.page || 1;
                const limit = options.limit || 20;
                const skip = (page - 1) * limit;
                const query = {
                    recipient: userId,
                    isDeleted: false,
                };
                if (options.onlyUnread) {
                    query.isRead = false;
                }
                const [notifications, total] = yield Promise.all([
                    notification_model_1.default.find(query)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .populate("sender", "name profileImage")
                        .populate("relatedReport", "title")
                        .populate("relatedComment", "comment")
                        .lean(),
                    notification_model_1.default.countDocuments(query),
                ]);
                this.logger.info("Notifications fetched successfully", {
                    userId,
                    count: notifications.length,
                    total,
                });
                return { notifications, total };
            }
            catch (error) {
                this.logger.error("Failed to fetch notifications", { error, userId });
                throw new Error("Failed to fetch notifications");
            }
        });
    }
    /**
     * Marks a notification as read
     * @param notificationId Notification ID
     * @param userId User ID
     * @returns Updated notification
     */
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("Marking notification as read", {
                    notificationId,
                    userId,
                });
                if (!notificationId || !userId) {
                    throw new Error("Notification ID and User ID are required");
                }
                const notification = yield notification_model_1.default.findOneAndUpdate({
                    _id: notificationId,
                    recipient: userId,
                }, {
                    isRead: true,
                    updatedAt: new Date(),
                }, { new: true });
                if (!notification) {
                    throw new Error("Notification not found or not accessible by this user");
                }
                this.logger.info("Notification marked as read", { notificationId });
                return notification;
            }
            catch (error) {
                this.logger.error("Failed to mark notification as read", {
                    error,
                    notificationId,
                    userId,
                });
                if (error instanceof Error || error instanceof Error) {
                    throw error;
                }
                throw new Error("Failed to mark notification as read");
            }
        });
    }
    /**
     * Marks all notifications for a user as read
     * @param userId User ID
     * @returns Result of the operation
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("Marking all notifications as read", { userId });
                if (!userId) {
                    throw new Error("User ID is required");
                }
                const result = yield notification_model_1.default.updateMany({
                    recipient: userId,
                    isRead: false,
                    isDeleted: false,
                }, {
                    isRead: true,
                    updatedAt: new Date(),
                });
                this.logger.info("All notifications marked as read", {
                    userId,
                    modifiedCount: result.modifiedCount,
                });
                return { modifiedCount: result.modifiedCount };
            }
            catch (error) {
                this.logger.error("Failed to mark all notifications as read", {
                    error,
                    userId,
                });
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error("Failed to mark all notifications as read");
            }
        });
    }
    /**
     * Soft deletes a notification
     * @param notificationId Notification ID
     * @param userId User ID
     * @returns Result of the operation
     */
    deleteNotification(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("Deleting notification", { notificationId, userId });
                if (!notificationId || !userId) {
                    throw new Error("Notification ID and User ID are required");
                }
                const result = yield notification_model_1.default.findOneAndUpdate({
                    _id: notificationId,
                    recipient: userId,
                    isDeleted: false,
                }, {
                    isDeleted: true,
                    updatedAt: new Date(),
                });
                if (!result) {
                    throw new Error("Notification not found or already deleted");
                }
                this.logger.info("Notification deleted successfully", { notificationId });
                return { success: true };
            }
            catch (error) {
                this.logger.error("Failed to delete notification", {
                    error,
                    notificationId,
                    userId,
                });
                if (error instanceof Error || error instanceof Error) {
                    throw error;
                }
                throw new Error("Failed to delete notification");
            }
        });
    }
    /**
     * Permanently deletes old notifications based on age
     * @param olderThan Date threshold in days
     * @returns Number of deleted notifications
     */
    purgeOldNotifications() {
        return __awaiter(this, arguments, void 0, function* (olderThan = 90) {
            const session = yield (0, mongoose_1.startSession)();
            try {
                this.logger.debug("Purging old notifications", { olderThan });
                session.startTransaction();
                const thresholdDate = new Date();
                thresholdDate.setDate(thresholdDate.getDate() - olderThan);
                const result = yield notification_model_1.default.deleteMany({
                    createdAt: { $lt: thresholdDate },
                    isDeleted: true,
                }, { session });
                yield session.commitTransaction();
                this.logger.info("Old notifications purged", {
                    deletedCount: result.deletedCount,
                });
                return { deletedCount: result.deletedCount };
            }
            catch (error) {
                yield session.abortTransaction();
                this.logger.error("Failed to purge old notifications", {
                    error,
                    olderThan,
                });
                throw new Error("Failed to purge old notifications");
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Gets count of unread notifications for a user
     * @param userId User ID
     * @returns Count of unread notifications
     */
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("Getting unread notification count", { userId });
                if (!userId) {
                    throw new Error("User ID is required");
                }
                const count = yield notification_model_1.default.countDocuments({
                    recipient: userId,
                    isRead: false,
                    isDeleted: false,
                });
                this.logger.info("Unread notification count retrieved", {
                    userId,
                    count,
                });
                return { count };
            }
            catch (error) {
                this.logger.error("Failed to get unread notification count", {
                    error,
                    userId,
                });
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error("Failed to get unread notification count");
            }
        });
    }
}
exports.default = new NotificationService();
