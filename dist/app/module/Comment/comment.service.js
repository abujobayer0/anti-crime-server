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
exports.CommentService = void 0;
const logger_1 = require("../../utils/logger");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const comment_model_1 = require("./comment.model");
const crimeReport_model_1 = require("../CrimeReport/crimeReport.model");
const notification_service_1 = __importDefault(require("../Notification/notification.service"));
const notification_interface_1 = require("../Notification/notification.interface");
const auth_model_1 = __importDefault(require("../Auth/auth.model"));
class CommentService {
    /**
     * Creates a new comment or reply to a comment for a crime report
     * @param reportId - ID of the crime report
     * @param userId - ID of the user creating the comment
     * @param data - Comment data including the comment text, optional proof images, and optional parent comment ID
     * @returns Promise resolving to the created comment or null
     * @throws AppError if the report, user, or parent comment is not found
     */
    static createComment(reportId, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Creating comment for report ${reportId} by user ${userId}`);
                if (!reportId || !mongoose_1.default.Types.ObjectId.isValid(reportId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid report ID is required");
                }
                if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid user ID is required");
                }
                if (!data.comment || data.comment.trim() === "") {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Comment text is required");
                }
                const report = yield crimeReport_model_1.CrimeReport.findById(reportId).populate("userId");
                if (!report) {
                    this.logger.error(`Crime report ${reportId} not found when creating comment`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime Report not found");
                }
                const user = yield auth_model_1.default.findById(userId).select("name profileImage");
                if (!user) {
                    this.logger.error(`User ${userId} not found when creating comment`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                const commentData = {
                    comment: data.comment.trim(),
                    proofImage: Array.isArray(data.proofImage) ? data.proofImage : [],
                    userId,
                    reportId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                if (data.replyTo) {
                    return this.createReplyComment(commentData, data.replyTo, user, report, userId);
                }
                // Create a new top-level comment
                return this.createTopLevelComment(commentData, user, report, userId);
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error creating comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create comment");
            }
        });
    }
    /**
     * Creates a reply to an existing comment
     * @param commentData - Base comment data
     * @param parentCommentId - ID of the parent comment
     * @param user - User creating the reply
     * @param report - Associated crime report
     * @param userId - ID of the user creating the reply
     * @returns Promise resolving to the created reply
     * @private
     */
    static createReplyComment(commentData, parentCommentId, user, report, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.default.Types.ObjectId.isValid(parentCommentId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid parent comment ID");
                }
                const parentComment = yield comment_model_1.Comment.findById(parentCommentId);
                if (!parentComment) {
                    this.logger.error(`Parent comment ${parentCommentId} not found`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Parent comment not found");
                }
                const replyComment = yield comment_model_1.Comment.create(commentData);
                this.logger.info(`Created reply comment ${replyComment._id}`);
                yield comment_model_1.Comment.findByIdAndUpdate(parentCommentId, {
                    $push: { replyTo: replyComment._id },
                    $set: { updatedAt: new Date() },
                }, { new: true });
                const isReplyingToOwnComment = parentComment.userId.toString() === userId;
                const recipientId = isReplyingToOwnComment
                    ? report.userId._id.toString()
                    : parentComment.userId.toString();
                yield this.createReplyNotification(recipientId, userId, replyComment, parentComment, report, user, isReplyingToOwnComment);
                return replyComment;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error creating reply comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create reply");
            }
        });
    }
    /**
     * Creates a top-level comment on a crime report
     * @param commentData - Comment data
     * @param user - User creating the comment
     * @param report - Associated crime report
     * @param userId - ID of the user creating the comment
     * @returns Promise resolving to the created comment
     * @private
     */
    static createTopLevelComment(commentData, user, report, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const comment = yield comment_model_1.Comment.create(commentData);
                this.logger.info(`Created top-level comment ${comment._id}`);
                const updatedReport = yield crimeReport_model_1.CrimeReport.findByIdAndUpdate(report._id, {
                    $push: { comments: comment._id },
                    $set: { updatedAt: new Date() },
                }, { new: true });
                if (!updatedReport) {
                    this.logger.error(`Failed to update crime report ${report._id} with new comment`);
                    throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update crime report");
                }
                if (report.userId._id.toString() !== userId) {
                    yield this.createCommentNotification(report.userId._id.toString(), userId, comment, report, user);
                }
                return comment;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error creating top-level comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create comment");
            }
        });
    }
    /**
     * Creates a notification for a new reply
     * @param recipientId - ID of the notification recipient
     * @param senderId - ID of the notification sender
     * @param replyComment - The reply comment
     * @param parentComment - The parent comment
     * @param report - The associated crime report
     * @param user - The user who created the reply
     * @param isReplyingToOwnComment - Whether the user is replying to their own comment
     * @private
     */
    static createReplyNotification(recipientId, senderId, replyComment, parentComment, report, user, isReplyingToOwnComment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notificationMessage = isReplyingToOwnComment
                    ? `${user === null || user === void 0 ? void 0 : user.name} replied to their own comment on your report: ${report.title}`
                    : `${user === null || user === void 0 ? void 0 : user.name} replied to your comment: ${parentComment.comment.substring(0, 50)}${parentComment.comment.length > 50 ? "..." : ""}`;
                yield notification_service_1.default.createNotification({
                    recipient: recipientId,
                    sender: senderId,
                    type: notification_interface_1.NotificationType.REPLY,
                    title: replyComment.comment.substring(0, 50) +
                        (replyComment.comment.length > 50 ? "..." : ""),
                    message: notificationMessage,
                    relatedReport: report._id.toString(),
                    relatedComment: replyComment._id.toString(),
                });
                this.logger.info(`Created reply notification for recipient ${recipientId}`);
            }
            catch (error) {
                this.logger.error(`Failed to create reply notification: ${error.message}`, error);
            }
        });
    }
    /**
     * Creates a notification for a new comment
     * @param recipientId - ID of the notification recipient
     * @param senderId - ID of the notification sender
     * @param comment - The new comment
     * @param report - The associated crime report
     * @param user - The user who created the comment
     * @private
     */
    static createCommentNotification(recipientId, senderId, comment, report, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield notification_service_1.default.createNotification({
                    recipient: recipientId,
                    sender: senderId,
                    type: notification_interface_1.NotificationType.COMMENT,
                    title: comment.comment.substring(0, 50) +
                        (comment.comment.length > 50 ? "..." : ""),
                    message: `${user === null || user === void 0 ? void 0 : user.name} commented on your report: ${report.title}`,
                    relatedReport: report._id.toString(),
                    relatedComment: comment._id.toString(),
                });
                this.logger.info(`Created comment notification for recipient ${recipientId}`);
            }
            catch (error) {
                this.logger.error(`Failed to create comment notification: ${error.message}`, error);
            }
        });
    }
    /**
     * Updates an existing comment
     * @param commentId - ID of the comment to update
     * @param userId - ID of the user attempting to update the comment (for authorization)
     * @param data - Updated comment data
     * @returns Promise resolving to the updated comment or null
     * @throws AppError if the comment is not found or user is not authorized
     */
    static updateComment(commentId, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Updating comment ${commentId}`);
                // Validate inputs
                if (!commentId || !mongoose_1.default.Types.ObjectId.isValid(commentId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid comment ID is required");
                }
                if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid user ID is required");
                }
                // Verify comment exists and user owns it
                const existingComment = yield comment_model_1.Comment.findById(commentId);
                if (!existingComment) {
                    this.logger.error(`Comment ${commentId} not found when updating`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Comment not found");
                }
                if (existingComment.userId.toString() !== userId) {
                    this.logger.warn(`Unauthorized update attempt for comment ${commentId} by user ${userId}`);
                    throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to update this comment");
                }
                const updateData = {
                    updatedAt: new Date(),
                };
                if (data.comment && data.comment.trim() !== "") {
                    updateData.comment = data.comment.trim();
                }
                if (Array.isArray(data.proofImage)) {
                    updateData.proofImage = data.proofImage;
                }
                const updatedComment = yield comment_model_1.Comment.findByIdAndUpdate(commentId, updateData, { new: true });
                if (!updatedComment) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Failed to update comment");
                }
                this.logger.info(`Successfully updated comment ${commentId}`);
                return updatedComment;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error updating comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update comment");
            }
        });
    }
    /**
     * Deletes a comment
     * @param commentId - ID of the comment to delete
     * @param userId - ID of the user attempting to delete the comment (for authorization)
     * @returns Promise resolving to the deleted comment or null
     * @throws AppError if the comment is not found or user is not authorized
     */
    static deleteComment(commentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Deleting comment ${commentId}`);
                if (!commentId || !mongoose_1.default.Types.ObjectId.isValid(commentId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid comment ID is required");
                }
                if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid user ID is required");
                }
                const comment = yield comment_model_1.Comment.findById(commentId);
                if (!comment) {
                    this.logger.error(`Comment ${commentId} not found when deleting`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Comment not found");
                }
                const report = yield crimeReport_model_1.CrimeReport.findById(comment.reportId).select("userId");
                const isCommentOwner = comment.userId.toString() === userId;
                const isReportOwner = report && report.userId.toString() === userId;
                if (!isCommentOwner && !isReportOwner) {
                    this.logger.warn(`Unauthorized delete attempt for comment ${commentId} by user ${userId}`);
                    throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to delete this comment");
                }
                if (comment.replyTo && comment.replyTo.length > 0) {
                    yield this.handleParentCommentDeletion(comment);
                }
                if (comment.replyTo) {
                    yield this.removeReplyReferenceFromParent(comment);
                }
                if (report && !comment.replyTo) {
                    yield this.removeCommentReferenceFromReport(comment, report._id);
                }
                const deletedComment = yield comment_model_1.Comment.findByIdAndDelete(commentId);
                if (!deletedComment) {
                    throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete comment");
                }
                this.logger.info(`Successfully deleted comment ${commentId}`);
                return deletedComment;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error deleting comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete comment");
            }
        });
    }
    /**
     * Handles deletion of a parent comment with replies
     * @param comment - The parent comment to delete
     * @private
     */
    static handleParentCommentDeletion(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield comment_model_1.Comment.updateMany({ _id: { $in: comment.replyTo } }, { $set: { parentDeleted: true } });
                this.logger.info(`Marked ${comment.replyTo.length} replies as having deleted parent`);
            }
            catch (error) {
                this.logger.error(`Error handling parent comment deletion: ${error.message}`, error);
            }
        });
    }
    /**
     * Removes reference to a reply from its parent comment
     * @param comment - The reply comment being deleted
     * @private
     */
    static removeReplyReferenceFromParent(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const parentComments = yield comment_model_1.Comment.find({
                    replyTo: { $elemMatch: { $eq: comment._id } },
                });
                for (const parent of parentComments) {
                    yield comment_model_1.Comment.findByIdAndUpdate(parent._id, {
                        $pull: { replyTo: comment._id },
                        $set: { updatedAt: new Date() },
                    });
                }
                if (parentComments.length > 0) {
                    this.logger.info(`Removed reply reference from ${parentComments.length} parent comments`);
                }
            }
            catch (error) {
                this.logger.error(`Error removing reply reference from parent: ${error.message}`, error);
            }
        });
    }
    /**
     * Removes reference to a comment from its associated crime report
     * @param comment - The comment being deleted
     * @param reportId - ID of the associated report
     * @private
     */
    static removeCommentReferenceFromReport(comment, reportId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield crimeReport_model_1.CrimeReport.findByIdAndUpdate(reportId, {
                    $pull: { comments: comment._id },
                    $set: { updatedAt: new Date() },
                });
                this.logger.info(`Removed comment reference from report ${reportId}`);
            }
            catch (error) {
                this.logger.error(`Error removing comment reference from report: ${error.message}`, error);
            }
        });
    }
    /**
     * Gets all comments for a crime report
     * @param reportId - ID of the crime report
     * @param options - Query options for pagination and sorting
     * @returns Promise resolving to an array of comments
     */
    static getCommentsByReportId(reportId_1) {
        return __awaiter(this, arguments, void 0, function* (reportId, options = {}) {
            try {
                this.logger.info(`Getting comments for report ${reportId}`);
                if (!reportId || !mongoose_1.default.Types.ObjectId.isValid(reportId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid report ID is required");
                }
                const limit = options.limit || 10;
                const page = options.page || 1;
                const skip = (page - 1) * limit;
                const sortBy = options.sortBy || "createdAt";
                const sortOrder = options.sortOrder || "desc";
                const sort = {};
                sort[sortBy] = sortOrder === "asc" ? 1 : -1;
                const comments = yield comment_model_1.Comment.find({
                    reportId,
                    replyTo: { $exists: false },
                })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate("userId", "name profileImage")
                    .populate({
                    path: "replyTo",
                    populate: {
                        path: "userId",
                        select: "name profileImage",
                    },
                });
                const total = yield comment_model_1.Comment.countDocuments({
                    reportId,
                    replyTo: { $exists: false },
                });
                this.logger.info(`Retrieved ${comments.length} comments for report ${reportId}`);
                return {
                    comments,
                    total,
                    page,
                    limit,
                };
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error getting comments: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve comments");
            }
        });
    }
    /**
     * Gets a single comment by ID
     * @param commentId - ID of the comment
     * @returns Promise resolving to the comment or null if not found
     */
    static getCommentById(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Getting comment ${commentId}`);
                if (!commentId || !mongoose_1.default.Types.ObjectId.isValid(commentId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid comment ID is required");
                }
                const comment = yield comment_model_1.Comment.findById(commentId)
                    .populate("userId", "name profileImage")
                    .populate({
                    path: "replyTo",
                    populate: {
                        path: "userId",
                        select: "name profileImage",
                    },
                });
                if (!comment) {
                    this.logger.warn(`Comment ${commentId} not found`);
                    return null;
                }
                return comment;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error getting comment: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve comment");
            }
        });
    }
}
exports.CommentService = CommentService;
CommentService.logger = new logger_1.Logger("CommentService");
exports.default = CommentService;
