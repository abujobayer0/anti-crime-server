import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { CrimeReport } from "../CrimeReport/crimeReport.model";
import NotificationService from "../Notification/notification.service";
import { NotificationType } from "../Notification/notification.interface";

import User from "../Auth/auth.model";
export class CommentService {
  static async createComment(
    reportId: string,
    userId: string,
    data: {
      comment: string;
      proofImage?: string[];
      replyTo?: string;
    }
  ): Promise<IComment | null> {
    const report = await CrimeReport.findById(reportId).populate("userId");
    const user = await User.findById(userId).select("name profileImage");
    if (!report) {
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    }

    const commentData: Partial<IComment> = {
      comment: data.comment,
      proofImage: data.proofImage || [],
      userId,
      reportId,
    };

    if (data.replyTo) {
      const parentComment = await Comment.findById(data.replyTo);
      if (!parentComment) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent comment not found");
      }

      const replyComment = await Comment.create(commentData);

      await Comment.findByIdAndUpdate(
        data.replyTo,
        {
          $push: { replyTo: replyComment._id },
        },
        { new: true }
      );
      await NotificationService.createNotification({
        recipient:
          parentComment.userId.toString() === userId
            ? report.userId._id.toString()
            : parentComment.userId.toString(),
        sender: userId,
        type: NotificationType.REPLY,
        title: replyComment.comment,
        message:
          parentComment.userId.toString() === userId
            ? `${user?.name} replied their own comment on your report: ${report.title}`
            : `${user?.name} replied to your comment: ${parentComment.comment}`,
        relatedReport: reportId,
        relatedComment: replyComment._id.toString(),
      });
      return replyComment;
    }

    const comment = await Comment.create(commentData);

    const updatedReport = await CrimeReport.findByIdAndUpdate(
      reportId,
      { $push: { comments: comment._id } },
      { new: true }
    );

    if (!updatedReport) {
      throw new AppError(httpStatus.NOT_FOUND, "Failed to update crime report");
    }

    if (report && report.userId._id.toString() !== userId) {
      await NotificationService.createNotification({
        recipient: report.userId._id.toString(),
        sender: userId,
        type: NotificationType.COMMENT,
        title: comment.comment,
        message: `${user?.name} commented on your report: ${report.title}`,
        relatedReport: reportId,
        relatedComment: comment._id.toString(),
      });
    }

    return comment;
  }

  static async updateComment(
    commentId: string,
    data: Partial<IComment>
  ): Promise<IComment | null> {
    const comment = await Comment.findByIdAndUpdate(commentId, data, {
      new: true,
    });
    return comment;
  }

  static async deleteComment(commentId: string): Promise<IComment | null> {
    const comment = await Comment.findByIdAndDelete(commentId);
    return comment;
  }
}
