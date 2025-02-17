import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { CrimeReport } from "../CrimeReport/crimeReport.model";

export class CommentService {
  static async createComment(
    id: string,
    userId: string,
    data: Partial<IComment>
  ): Promise<IComment | null> {
    const report = await CrimeReport.findById(id);

    if (!report) {
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    }
    const comment = await Comment.create({
      ...data,
      userId,
    });

    return await CrimeReport.findByIdAndUpdate(
      id,
      { $push: { comments: comment._id } },
      { new: true }
    );
  }
}
