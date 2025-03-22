import { ICrimeReport } from "./crimeReport.interface";
import httpStatus from "http-status";
import { CrimeReport } from "./crimeReport.model";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/queryBuilder";
import { COMMENT_POPULATE_CONFIG } from "./crimeReport.config";
import User from "../Auth/auth.model";
import { TUser } from "../Auth/auth.interface";
import { ObjectId } from "mongoose";
import { NotificationType } from "../Notification/notification.interface";
import notificationService from "../Notification/notification.service";
import Logger from "../../utils/logger";

type SearchResult = {
  type: "report" | "user";
  data: ICrimeReport | TUser;
  algorithmScore?: number;
};

interface VoteResponse {
  upvotes: number;
  downvotes: number;
  userVote: "upvote" | "downvote" | null;
}

export class CrimeReportService {
  /**
   * Create a new crime report
   * @param data - Crime report data
   * @returns Promise resolving to the created crime report
   */
  private static readonly logger = new Logger("CrimeReport");

  static async createCrimeReport(
    data: Partial<ICrimeReport>
  ): Promise<ICrimeReport> {
    try {
      return await CrimeReport.create(data);
    } catch (error: any) {
      this.logger.error("Error creating crime report:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create crime report"
      );
    }
  }

  /**
   * Get all non-deleted crime reports
   * @returns Promise resolving to an array of crime reports
   */
  static async getAllCrimeReports(): Promise<ICrimeReport[]> {
    try {
      const reports = await CrimeReport.find({ isDeleted: false })
        .populate("userId")
        .populate(COMMENT_POPULATE_CONFIG)
        .populate("upvotes")
        .populate("downvotes")
        .sort({ createdAt: -1 });

      if (!reports || reports.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "Crime Reports not found");
      }
      return reports;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error("Error fetching all crime reports:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch crime reports"
      );
    }
  }

  /**
   * Get all algorithmically sorted reports
   * @returns Promise resolving to an array of algorithmically sorted crime reports
   */
  static async getAllAlgorithmicReports(): Promise<ICrimeReport[]> {
    try {
      return await this.getAlgorithmicReports();
    } catch (error: any) {
      this.logger.error("Error fetching algorithmic reports:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch algorithmic reports"
      );
    }
  }

  /**
   * Get crime report by ID
   * @param id - Crime report ID
   * @returns Promise resolving to the crime report or null
   */
  static async getCrimeReportById(id: string): Promise<ICrimeReport | null> {
    try {
      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Report ID is required");
      }

      const report = await CrimeReport.findById(id)
        .populate("userId")
        .populate(COMMENT_POPULATE_CONFIG)
        .populate("upvotes")
        .populate("downvotes")
        .sort({ createdAt: -1 });

      if (!report)
        throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
      return report;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(`Error fetching crime report with ID ${id}:`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch crime report"
      );
    }
  }

  /**
   * Get reports by user ID
   * @param userId - User ID
   * @returns Promise resolving to an array of crime reports
   */
  static async getUserReports(userId: ObjectId): Promise<ICrimeReport[]> {
    try {
      if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const userReports = await CrimeReport.find({ userId })
        .populate("userId")
        .sort({ createdAt: -1 });

      if (!userReports || userReports.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "User reports not found");
      }

      return userReports;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        `Error fetching user reports for user ${userId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch user reports"
      );
    }
  }

  /**
   * Get profile reports by user ID string
   * @param userId - User ID as string
   * @returns Promise resolving to an array of crime reports
   */
  static async getProfileReports(userId: string): Promise<ICrimeReport[]> {
    try {
      if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const userReports = await CrimeReport.find({ userId })
        .populate("userId")
        .sort({ createdAt: -1 });

      if (!userReports || userReports.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "User reports not found");
      }

      return userReports;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        `Error fetching profile reports for user ${userId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch profile reports"
      );
    }
  }

  /**
   * Get reports created in the last 24 hours
   * @returns Promise resolving to an array of recent crime reports
   */
  static async getRecentReports(): Promise<ICrimeReport[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentReports = await CrimeReport.find({
        createdAt: { $gte: twentyFourHoursAgo },
        isDeleted: false,
      })
        .populate("userId")
        .sort({ createdAt: -1 });

      return recentReports || [];
    } catch (error: any) {
      this.logger.error("Error fetching recent reports:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch recent reports"
      );
    }
  }

  /**
   * Update crime report by ID
   * @param id - Crime report ID
   * @param updates - Crime report updates
   * @returns Promise resolving to the updated crime report or null
   */
  static async updateCrimeReport(
    id: string,
    updates: Partial<ICrimeReport>
  ): Promise<ICrimeReport | null> {
    try {
      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Report ID is required");
      }

      const updatedReport = await CrimeReport.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedReport)
        throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
      return updatedReport;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(`Error updating crime report with ID ${id}:`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update crime report"
      );
    }
  }

  /**
   * Soft delete crime report by ID (mark as deleted)
   * @param id - Crime report ID
   * @returns Promise resolving when the report is marked as deleted
   */
  static async deleteCrimeReport(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Report ID is required");
      }

      const report = await CrimeReport.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!report)
        throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(`Error deleting crime report with ID ${id}:`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete crime report"
      );
    }
  }

  /**
   * Search for crime reports and users based on query string
   * @param query - Search query string
   * @returns Promise resolving to an array of search results
   */
  static async queryCrimeReports(query: string): Promise<SearchResult[]> {
    try {
      if (!query || typeof query !== "string") {
        throw new AppError(httpStatus.BAD_REQUEST, "Valid query is required");
      }

      const crimeReportQuery = CrimeReport.find({ isDeleted: false })
        .populate({
          path: "userId",
          select: "name email",
        })
        .populate(COMMENT_POPULATE_CONFIG)
        .populate("upvotes")
        .populate("downvotes");

      const userQuery = User.find({ isBanned: false }).select("-password");

      const crimeReportBuilder = new QueryBuilder(crimeReportQuery, {
        searchTerm: query,
      }).search(["title", "description", "division", "district"]);

      const userBuilder = new QueryBuilder(userQuery, {
        searchTerm: query,
      }).search(["name", "email"]);

      const [reports, users] = await Promise.all([
        crimeReportBuilder.modelQuery,
        userBuilder.modelQuery,
      ]);

      const scoredReports = this.scoreReports(reports, query);

      const results: SearchResult[] = [
        ...scoredReports.sort(
          (a, b) => (b.algorithmScore || 0) - (a.algorithmScore || 0)
        ),
        ...users.map((user) => ({ type: "user" as const, data: user })),
      ];

      return results;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        `Error querying crime reports with query "${query}":`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to query crime reports"
      );
    }
  }

  /**
   * Toggle upvote on a crime report
   * @param reportId - Crime report ID
   * @param userId - User ID
   * @returns Promise resolving to vote response
   */
  static async toggleUpvote(
    reportId: string,
    userId: string
  ): Promise<VoteResponse> {
    try {
      return await this.toggleVote(reportId, userId, "upvote");
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        `Error toggling upvote on report ${reportId} by user ${userId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to toggle upvote"
      );
    }
  }

  /**
   * Toggle downvote on a crime report
   * @param reportId - Crime report ID
   * @param userId - User ID
   * @returns Promise resolving to vote response
   */
  static async toggleDownvote(
    reportId: string,
    userId: string
  ): Promise<VoteResponse> {
    try {
      return await this.toggleVote(reportId, userId, "downvote");
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        `Error toggling downvote on report ${reportId} by user ${userId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to toggle downvote"
      );
    }
  }

  /**
   * Get algorithmically sorted reports
   * @returns Promise resolving to an array of algorithmically sorted crime reports
   */
  static async getAlgorithmicReports(): Promise<ICrimeReport[]> {
    try {
      const reports = await CrimeReport.find({ isDeleted: false })
        .populate("userId")
        .populate(COMMENT_POPULATE_CONFIG)
        .populate("upvotes")
        .populate("downvotes");

      const scoredReports = reports.map((report) => {
        const score = this.calculateReportScore(report);
        return {
          report,
          score,
        };
      });

      return scoredReports
        .sort((a, b) => b.score - a.score)
        .map((item) => ({
          ...item.report.toObject(),
          algorithmScore: item.score,
        }));
    } catch (error: any) {
      this.logger.error("Error getting algorithmic reports:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to get algorithmic reports"
      );
    }
  }

  /**
   * Helper method to calculate report score for algorithmic sorting
   * @param report - Crime report
   * @returns Score value
   */
  private static calculateReportScore(report: ICrimeReport): number {
    let score = 0;

    const upvotes = report.upvotes.length;
    const downvotes = report.downvotes.length;
    const totalVotes = upvotes + downvotes;

    if (totalVotes > 0) {
      const z = 1.96;
      const p = upvotes / totalVotes;
      const denominator = totalVotes + z * z;
      const center = (p + (z * z) / (2 * totalVotes)) / denominator;
      const uncertainty =
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * totalVotes)) / denominator);
      const voteScore = center - uncertainty;
      score += voteScore * 1000;
    }

    const hoursAge =
      (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60);
    const timeDecay = 1 / (1 + Math.log(hoursAge + 1));
    score *= timeDecay;

    const commentCount = report.comments?.length || 0;
    const commentBonus = Math.log(commentCount + 1) * 100;
    score += commentBonus;

    if (upvotes > 0 && downvotes > 0) {
      const controversyBonus = Math.min(upvotes, downvotes) * 10;
      score += controversyBonus;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Helper method to score reports for search results
   * @param reports - Array of crime reports
   * @param query - Search query string
   * @returns Array of scored search results
   */
  private static scoreReports(
    reports: ICrimeReport[],
    query: string
  ): SearchResult[] {
    return reports.map((report) => {
      let score = this.calculateReportScore(report);

      const queryLower = query.toLowerCase();
      if (report.title?.toLowerCase().includes(queryLower)) score *= 1.5;
      if (report.description?.toLowerCase().includes(queryLower)) score *= 1.3;
      if (report.division?.toLowerCase().includes(queryLower)) score *= 1.2;
      if (report.district?.toLowerCase().includes(queryLower)) score *= 1.2;

      return {
        type: "report" as const,
        data: report,
        algorithmScore: Math.round(score * 100) / 100,
      };
    });
  }

  /**
   * Toggle vote (upvote or downvote) on a crime report
   * @param reportId - Crime report ID
   * @param userId - User ID
   * @param voteType - Type of vote (upvote or downvote)
   * @returns Promise resolving to vote response
   */
  private static async toggleVote(
    reportId: string,
    userId: string,
    voteType: "upvote" | "downvote"
  ): Promise<VoteResponse> {
    if (!reportId || !userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Report ID and User ID are required"
      );
    }

    const oppositeVoteType = voteType === "upvote" ? "downvotes" : "upvotes";
    const currentVoteType = voteType === "upvote" ? "upvotes" : "downvotes";

    const hasOppositeVote = await CrimeReport.exists({
      _id: reportId,
      [oppositeVoteType]: userId,
    });

    if (hasOppositeVote) {
      await CrimeReport.updateOne(
        { _id: reportId },
        { $pull: { [oppositeVoteType]: userId } }
      );
    }

    const hasCurrentVote = await CrimeReport.exists({
      _id: reportId,
      [currentVoteType]: userId,
    });

    let report;
    let isAddingVote = false;

    if (hasCurrentVote) {
      report = await CrimeReport.findOneAndUpdate(
        { _id: reportId },
        { $pull: { [currentVoteType]: userId } },
        { new: true }
      ).populate("userId");
    } else {
      isAddingVote = true;
      report = await CrimeReport.findOneAndUpdate(
        { _id: reportId },
        { $addToSet: { [currentVoteType]: userId } },
        { new: true }
      ).populate("userId");
    }

    if (!report) {
      throw new AppError(httpStatus.NOT_FOUND, "Crime report not found");
    }

    if (isAddingVote) {
      try {
        const voter = await User.findById(userId);

        if (report.userId._id.toString() !== userId) {
          await notificationService.createNotification({
            recipient: report.userId._id.toString(),
            sender: userId,
            type:
              voteType === "upvote"
                ? NotificationType.UPVOTE
                : NotificationType.DOWNVOTE,
            title: voteType === "upvote" ? "New Upvote" : "New Downvote",
            message: `${voter?.name || "A user"} ${voteType}d your report: ${
              report.title
            }`,
            relatedReport: reportId,
          });
        }
      } catch (error: any) {
        this.logger.error(
          `Failed to create notification for ${voteType} on report ${reportId}:`,
          error
        );
      }
    }

    return {
      upvotes: report.upvotes.length,
      downvotes: report.downvotes.length,
      userVote: hasCurrentVote ? null : voteType,
    };
  }
}
