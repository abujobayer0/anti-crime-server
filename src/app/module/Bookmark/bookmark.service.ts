import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import User from "../Auth/auth.model";
import { IBookmark } from "./bookmark.interface";
import { Bookmark } from "./bookmark.model";
import Logger from "../../utils/logger";

/**
 * Service class for handling bookmark-related operations
 * @class BookmarkService
 */
export class BookmarkService {
  private static readonly logger = new Logger("BookmarkService");

  /**
   * Creates a new bookmark for a report
   * @param reportId - The ID of the report to bookmark
   * @param userId - The ID of the user creating the bookmark
   * @returns Promise resolving to the created bookmark or null
   * @throws AppError if the user is not found or bookmark already exists
   */
  public static async createBookmark(
    reportId: string,
    userId: string
  ): Promise<IBookmark> {
    try {
      this.logger.info(
        `Creating bookmark for report ${reportId} by user ${userId}`
      );

      if (!reportId || !userId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Report ID and User ID are required"
        );
      }

      const existingBookmark = await Bookmark.findOne({ userId, reportId });
      if (existingBookmark) {
        this.logger.warn(
          `Bookmark already exists for report ${reportId} by user ${userId}`
        );
        throw new AppError(
          httpStatus.CONFLICT,
          "Bookmark already exists for this report"
        );
      }

      const user = await User.findById(userId).select("_id");
      if (!user) {
        this.logger.error(`User ${userId} not found when creating bookmark`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      const createdBookmark = await Bookmark.create({
        userId,
        reportId,
      });

      this.logger.info(`Successfully created bookmark ${createdBookmark._id}`);
      return createdBookmark;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error creating bookmark: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create bookmark"
      );
    }
  }

  /**
   * Retrieves all bookmarks for a specific user
   * @param userId - The ID of the user
   * @returns Promise resolving to an array of bookmarks or empty array if none found
   * @throws AppError if there's an error during retrieval
   */
  public static async getBookmarksByUserId(
    userId: string
  ): Promise<IBookmark[]> {
    try {
      this.logger.info(`Retrieving bookmarks for user ${userId}`);

      if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const bookmarks = await Bookmark.find({ userId })
        .populate("reportId")
        .sort({ createdAt: -1 });

      this.logger.info(
        `Retrieved ${bookmarks.length} bookmarks for user ${userId}`
      );
      return bookmarks;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error retrieving bookmarks: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve bookmarks"
      );
    }
  }

  /**
   * Deletes a bookmark by its ID
   * @param bookmarkId - The ID of the bookmark to delete
   * @param userId - The ID of the user requesting deletion (for authorization)
   * @returns Promise resolving to the deleted bookmark or null if not found
   * @throws AppError if bookmark not found or user not authorized
   */
  public static async deleteBookmarkById(
    bookmarkId: string,
    userId: string
  ): Promise<IBookmark | null> {
    try {
      this.logger.info(`Deleting bookmark ${bookmarkId} by user ${userId}`);

      if (!bookmarkId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Bookmark ID is required");
      }

      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        this.logger.warn(`Bookmark ${bookmarkId} not found for deletion`);
        throw new AppError(httpStatus.NOT_FOUND, "Bookmark not found");
      }

      if (bookmark.userId.toString() !== userId) {
        this.logger.warn(
          `User ${userId} not authorized to delete bookmark ${bookmarkId}`
        );
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Not authorized to delete this bookmark"
        );
      }

      const deletedBookmark = await Bookmark.findByIdAndDelete(bookmarkId);

      this.logger.info(`Successfully deleted bookmark ${bookmarkId}`);
      return deletedBookmark;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error deleting bookmark: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete bookmark"
      );
    }
  }

  /**
   * Checks if a user has bookmarked a specific report
   * @param reportId - The ID of the report
   * @param userId - The ID of the user
   * @returns Promise resolving to a boolean indicating if the report is bookmarked
   */
  public static async isReportBookmarked(
    reportId: string,
    userId: string
  ): Promise<boolean> {
    try {
      this.logger.info(
        `Checking if report ${reportId} is bookmarked by user ${userId}`
      );

      if (!reportId || !userId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Report ID and User ID are required"
        );
      }

      const bookmark = await Bookmark.findOne({ userId, reportId });
      return !!bookmark;
    } catch (error: any) {
      this.logger.error(
        `Error checking bookmark status: ${error.message}`,
        error
      );
      return false;
    }
  }
}
