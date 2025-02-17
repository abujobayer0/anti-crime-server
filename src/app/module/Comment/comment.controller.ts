import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { CommentService } from "./comment.service";
import sendResponse from "../../utils/sendResponse";

export class CommentController {
  static createComment = catchAsync(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const userId = req.user?.id;
    const comment = await CommentService.createComment(
      reportId,
      userId,
      req.body
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  });
}
