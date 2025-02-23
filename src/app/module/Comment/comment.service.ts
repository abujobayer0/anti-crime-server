import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { CrimeReport } from "../CrimeReport/crimeReport.model";

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
    const report = await CrimeReport.findById(reportId);
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
