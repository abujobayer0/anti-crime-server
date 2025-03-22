import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

import sendResponse from "../../utils/sendResponse";
import { BookmarkService } from "./bookmark.service";

export class BookmarkController {
  static createBookmark = catchAsync(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const userId = req.user?.id;
    const bookmark = await BookmarkService.createBookmark(reportId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookmark created successfully",
      data: bookmark,
    });
  });

  static getBookmarks = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const bookmark = await BookmarkService.getBookmarksByUserId(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookmark get successfully",
      data: bookmark,
    });
  });

  static deleteBookmark = catchAsync(async (req: Request, res: Response) => {
    const { bookmarkId } = req.params;
    const userId = req.user?.id;
    const bookmark = await BookmarkService.deleteBookmarkById(
      bookmarkId,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookmark deleted successfully",
      data: bookmark,
    });
  });
}
