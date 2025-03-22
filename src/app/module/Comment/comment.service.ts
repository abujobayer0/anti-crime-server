import { Logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";
import { CrimeReport } from "../CrimeReport/crimeReport.model";
import NotificationService from "../Notification/notification.service";
import { NotificationType } from "../Notification/notification.interface";
import User from "../Auth/auth.model";

interface ICreateCommentData {
  comment: string;
  proofImage?: string[];
  replyTo?: string;
}

export class CommentService {
  private static readonly logger = new Logger("CommentService");

  /**
   * Creates a new comment or reply to a comment for a crime report
   * @param reportId - ID of the crime report
   * @param userId - ID of the user creating the comment
   * @param data - Comment data including the comment text, optional proof images, and optional parent comment ID
   * @returns Promise resolving to the created comment or null
   * @throws AppError if the report, user, or parent comment is not found
   */
  public static async createComment(
    reportId: string,
    userId: string,
    data: ICreateCommentData
  ): Promise<IComment> {
    try {
      this.logger.info(
        `Creating comment for report ${reportId} by user ${userId}`
      );

      if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Valid report ID is required"
        );
      }

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Valid user ID is required");
      }

      if (!data.comment || data.comment.trim() === "") {
        throw new AppError(httpStatus.BAD_REQUEST, "Comment text is required");
      }

      const report = await CrimeReport.findById(reportId).populate("userId");
      if (!report) {
        this.logger.error(
          `Crime report ${reportId} not found when creating comment`
        );
        throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
      }

      const user = await User.findById(userId).select("name profileImage");
      if (!user) {
        this.logger.error(`User ${userId} not found when creating comment`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      const commentData: Partial<IComment> = {
        comment: data.comment.trim(),
        proofImage: Array.isArray(data.proofImage) ? data.proofImage : [],
        userId,
        reportId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (data.replyTo) {
        return this.createReplyComment(
          commentData,
          data.replyTo,
          user,
          report,
          userId
        );
      }

      // Create a new top-level comment
      return this.createTopLevelComment(commentData, user, report, userId);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error creating comment: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create comment"
      );
    }
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
  private static async createReplyComment(
    commentData: Partial<IComment>,
    parentCommentId: string,
    user: any,
    report: any,
    userId: string
  ): Promise<IComment> {
    try {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid parent comment ID");
      }

      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        this.logger.error(`Parent comment ${parentCommentId} not found`);
        throw new AppError(httpStatus.NOT_FOUND, "Parent comment not found");
      }

      const replyComment = await Comment.create(commentData);
      this.logger.info(`Created reply comment ${replyComment._id}`);

      await Comment.findByIdAndUpdate(
        parentCommentId,
        {
          $push: { replyTo: replyComment._id },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      const isReplyingToOwnComment = parentComment.userId.toString() === userId;
      const recipientId = isReplyingToOwnComment
        ? report.userId._id.toString()
        : parentComment.userId.toString();

      await this.createReplyNotification(
        recipientId,
        userId,
        replyComment,
        parentComment,
        report,
        user,
        isReplyingToOwnComment
      );

      return replyComment;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error creating reply comment: ${error.message}`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create reply"
      );
    }
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
  private static async createTopLevelComment(
    commentData: Partial<IComment>,
    user: any,
    report: any,
    userId: string
  ): Promise<IComment> {
    try {
      const comment = await Comment.create(commentData);
      this.logger.info(`Created top-level comment ${comment._id}`);

      const updatedReport = await CrimeReport.findByIdAndUpdate(
        report._id,
        {
          $push: { comments: comment._id },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (!updatedReport) {
        this.logger.error(
          `Failed to update crime report ${report._id} with new comment`
        );
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to update crime report"
        );
      }

      if (report.userId._id.toString() !== userId) {
        await this.createCommentNotification(
          report.userId._id.toString(),
          userId,
          comment,
          report,
          user
        );
      }

      return comment;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error creating top-level comment: ${error.message}`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create comment"
      );
    }
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
  private static async createReplyNotification(
    recipientId: string,
    senderId: string,
    replyComment: IComment,
    parentComment: IComment,
    report: any,
    user: any,
    isReplyingToOwnComment: boolean
  ): Promise<void> {
    try {
      const notificationMessage = isReplyingToOwnComment
        ? `${user?.name} replied to their own comment on your report: ${report.title}`
        : `${user?.name} replied to your comment: ${parentComment.comment.substring(0, 50)}${parentComment.comment.length > 50 ? "..." : ""}`;

      await NotificationService.createNotification({
        recipient: recipientId,
        sender: senderId,
        type: NotificationType.REPLY,
        title:
          replyComment.comment.substring(0, 50) +
          (replyComment.comment.length > 50 ? "..." : ""),
        message: notificationMessage,
        relatedReport: report._id.toString(),
        relatedComment: replyComment._id.toString(),
      });

      this.logger.info(
        `Created reply notification for recipient ${recipientId}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create reply notification: ${error.message}`,
        error
      );
    }
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
  private static async createCommentNotification(
    recipientId: string,
    senderId: string,
    comment: IComment,
    report: any,
    user: any
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        recipient: recipientId,
        sender: senderId,
        type: NotificationType.COMMENT,
        title:
          comment.comment.substring(0, 50) +
          (comment.comment.length > 50 ? "..." : ""),
        message: `${user?.name} commented on your report: ${report.title}`,
        relatedReport: report._id.toString(),
        relatedComment: comment._id.toString(),
      });

      this.logger.info(
        `Created comment notification for recipient ${recipientId}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create comment notification: ${error.message}`,
        error
      );
    }
  }

  /**
   * Updates an existing comment
   * @param commentId - ID of the comment to update
   * @param userId - ID of the user attempting to update the comment (for authorization)
   * @param data - Updated comment data
   * @returns Promise resolving to the updated comment or null
   * @throws AppError if the comment is not found or user is not authorized
   */
  public static async updateComment(
    commentId: string,
    userId: string,
    data: Partial<IComment>
  ): Promise<IComment> {
    try {
      this.logger.info(`Updating comment ${commentId}`);

      // Validate inputs
      if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Valid comment ID is required"
        );
      }

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Valid user ID is required");
      }

      // Verify comment exists and user owns it
      const existingComment = await Comment.findById(commentId);
      if (!existingComment) {
        this.logger.error(`Comment ${commentId} not found when updating`);
        throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
      }

      if (existingComment.userId.toString() !== userId) {
        this.logger.warn(
          `Unauthorized update attempt for comment ${commentId} by user ${userId}`
        );
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not authorized to update this comment"
        );
      }

      const updateData: Partial<IComment> = {
        updatedAt: new Date(),
      };

      if (data.comment && data.comment.trim() !== "") {
        updateData.comment = data.comment.trim();
      }

      if (Array.isArray(data.proofImage)) {
        updateData.proofImage = data.proofImage;
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        updateData,
        { new: true }
      );

      if (!updatedComment) {
        throw new AppError(httpStatus.NOT_FOUND, "Failed to update comment");
      }

      this.logger.info(`Successfully updated comment ${commentId}`);
      return updatedComment;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error updating comment: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update comment"
      );
    }
  }

  /**
   * Deletes a comment
   * @param commentId - ID of the comment to delete
   * @param userId - ID of the user attempting to delete the comment (for authorization)
   * @returns Promise resolving to the deleted comment or null
   * @throws AppError if the comment is not found or user is not authorized
   */
  public static async deleteComment(
    commentId: string,
    userId: string
  ): Promise<IComment> {
    try {
      this.logger.info(`Deleting comment ${commentId}`);

      if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Valid comment ID is required"
        );
      }

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Valid user ID is required");
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        this.logger.error(`Comment ${commentId} not found when deleting`);
        throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
      }

      const report = await CrimeReport.findById(comment.reportId).select(
        "userId"
      );

      const isCommentOwner = comment.userId.toString() === userId;
      const isReportOwner = report && report.userId.toString() === userId;

      if (!isCommentOwner && !isReportOwner) {
        this.logger.warn(
          `Unauthorized delete attempt for comment ${commentId} by user ${userId}`
        );
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not authorized to delete this comment"
        );
      }

      if (comment.replyTo && comment.replyTo.length > 0) {
        await this.handleParentCommentDeletion(comment);
      }

      if (comment.replyTo) {
        await this.removeReplyReferenceFromParent(comment);
      }

      if (report && !comment.replyTo) {
        await this.removeCommentReferenceFromReport(comment, report._id);
      }

      const deletedComment = await Comment.findByIdAndDelete(commentId);
      if (!deletedComment) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to delete comment"
        );
      }

      this.logger.info(`Successfully deleted comment ${commentId}`);
      return deletedComment;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error deleting comment: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete comment"
      );
    }
  }

  /**
   * Handles deletion of a parent comment with replies
   * @param comment - The parent comment to delete
   * @private
   */
  private static async handleParentCommentDeletion(
    comment: IComment
  ): Promise<void> {
    try {
      await Comment.updateMany(
        { _id: { $in: comment.replyTo } },
        { $set: { parentDeleted: true } }
      );

      this.logger.info(
        `Marked ${comment.replyTo.length} replies as having deleted parent`
      );
    } catch (error: any) {
      this.logger.error(
        `Error handling parent comment deletion: ${error.message}`,
        error
      );
    }
  }

  /**
   * Removes reference to a reply from its parent comment
   * @param comment - The reply comment being deleted
   * @private
   */
  private static async removeReplyReferenceFromParent(
    comment: IComment
  ): Promise<void> {
    try {
      const parentComments = await Comment.find({
        replyTo: { $elemMatch: { $eq: comment._id } },
      });

      for (const parent of parentComments) {
        await Comment.findByIdAndUpdate(parent._id, {
          $pull: { replyTo: comment._id },
          $set: { updatedAt: new Date() },
        });
      }

      if (parentComments.length > 0) {
        this.logger.info(
          `Removed reply reference from ${parentComments.length} parent comments`
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error removing reply reference from parent: ${error.message}`,
        error
      );
    }
  }

  /**
   * Removes reference to a comment from its associated crime report
   * @param comment - The comment being deleted
   * @param reportId - ID of the associated report
   * @private
   */
  private static async removeCommentReferenceFromReport(
    comment: IComment,
    reportId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await CrimeReport.findByIdAndUpdate(reportId, {
        $pull: { comments: comment._id },
        $set: { updatedAt: new Date() },
      });

      this.logger.info(`Removed comment reference from report ${reportId}`);
    } catch (error: any) {
      this.logger.error(
        `Error removing comment reference from report: ${error.message}`,
        error
      );
    }
  }

  /**
   * Gets all comments for a crime report
   * @param reportId - ID of the crime report
   * @param options - Query options for pagination and sorting
   * @returns Promise resolving to an array of comments
   */
  public static async getCommentsByReportId(
    reportId: string,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    comments: IComment[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      this.logger.info(`Getting comments for report ${reportId}`);

      if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Valid report ID is required"
        );
      }

      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder || "desc";

      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const comments = await Comment.find({
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

      const total = await Comment.countDocuments({
        reportId,
        replyTo: { $exists: false },
      });

      this.logger.info(
        `Retrieved ${comments.length} comments for report ${reportId}`
      );
      return {
        comments,
        total,
        page,
        limit,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error getting comments: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve comments"
      );
    }
  }

  /**
   * Gets a single comment by ID
   * @param commentId - ID of the comment
   * @returns Promise resolving to the comment or null if not found
   */
  public static async getCommentById(
    commentId: string
  ): Promise<IComment | null> {
    try {
      this.logger.info(`Getting comment ${commentId}`);

      if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Valid comment ID is required"
        );
      }

      const comment = await Comment.findById(commentId)
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
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error getting comment: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve comment"
      );
    }
  }
}

export default CommentService;
