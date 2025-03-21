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

export class CrimeReportService {
  static async createCrimeReport(
    data: Partial<ICrimeReport>
  ): Promise<ICrimeReport> {
    return await CrimeReport.create(data);
  }

  static async getAllCrimeReports(): Promise<ICrimeReport[]> {
    const reports = await CrimeReport.find({ isDeleted: false })
      .populate("userId")
      .populate(COMMENT_POPULATE_CONFIG)
      .populate("upvotes")
      .populate("downvotes")
      .sort({ createdAt: -1 });

    if (!reports) {
      throw new AppError(httpStatus.NOT_FOUND, "Crime Reports not found");
    }
    return reports;
  }

  static async getAllAlgorithmicReports(): Promise<ICrimeReport[]> {
    return await this.getAlgorithmicReports();
  }

  static async getCrimeReportById(id: string): Promise<ICrimeReport | null> {
    const report = await CrimeReport.findById(id)
      .populate("userId")
      .populate(COMMENT_POPULATE_CONFIG)
      .populate("upvotes")
      .populate("downvotes")
      .sort({ createdAt: -1 });

    if (!report)
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    return report;
  }

  static async getUserReports(userId: ObjectId) {
    const userReports = await CrimeReport.find({ userId })
      .populate("userId")
      .sort({ createdAt: -1 });

    if (!userReports) {
      throw new AppError(httpStatus.NOT_FOUND, "User reports not found");
    }

    return userReports;
  }

  static async getProfileReports(userId: string) {
    const userReports = await CrimeReport.find({ userId })
      .populate("userId")
      .sort({ createdAt: -1 });

    if (!userReports) {
      throw new AppError(httpStatus.NOT_FOUND, "User reports not found");
    }

    return userReports;
  }

  static async getRecentReports() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    const recentReports = await CrimeReport.find({
      createdAt: { $gte: twentyFourHoursAgo },
    })
      .populate("userId")
      .sort({ createdAt: -1 });

    if (!recentReports.length) {
      return [];
    }

    return recentReports;
  }

  static async updateCrimeReport(
    id: string,
    updates: Partial<ICrimeReport>
  ): Promise<ICrimeReport | null> {
    const updatedReport = await CrimeReport.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedReport)
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    return updatedReport;
  }

  static async deleteCrimeReport(id: string): Promise<void> {
    const report = await CrimeReport.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!report)
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
  }

  static async queryCrimeReports(query: string) {
    type SearchResult = {
      type: "report" | "user";
      data: ICrimeReport | TUser;
      algorithmScore?: number;
    };

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

    const reports = await crimeReportBuilder.modelQuery;
    const users = await userBuilder.modelQuery;

    const scoredReports = reports.map((report) => {
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
          z *
          Math.sqrt((p * (1 - p) + (z * z) / (4 * totalVotes)) / denominator);
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

    const results: SearchResult[] = [
      ...scoredReports.sort(
        (a, b) => (b.algorithmScore || 0) - (a.algorithmScore || 0)
      ),
      ...users.map((user) => ({ type: "user" as const, data: user })),
    ];

    return results;
  }

  static async toggleVote(
    reportId: string,
    userId: string,
    voteType: "upvote" | "downvote"
  ) {
    const report = await CrimeReport.findById(reportId).populate("userId");

    if (!report) {
      throw new AppError(httpStatus.NOT_FOUND, "Crime report not found");
    }

    const oppositeVoteType = voteType === "upvote" ? "downvotes" : "upvotes";
    const currentVoteType = voteType === "upvote" ? "upvotes" : "downvotes";

    if (report[oppositeVoteType].includes(userId)) {
      report[oppositeVoteType] = report[oppositeVoteType].filter(
        (id) => id.toString() !== userId
      );
    }

    const isAddingVote = !report[currentVoteType].includes(userId);

    if (!isAddingVote) {
      report[currentVoteType] = report[currentVoteType].filter(
        (id) => id.toString() !== userId
      );
    } else {
      report[currentVoteType].push(userId);
    }

    await report.save();

    if (isAddingVote) {
      const voter = await User.findById(userId);
      await notificationService.createNotification({
        recipient: report.userId._id.toString(),
        sender: userId,
        type:
          voteType === "upvote"
            ? NotificationType.UPVOTE
            : NotificationType.DOWNVOTE,
        title: voteType === "upvote" ? "New Upvote" : "New Downvote",
        message: `${voter?.name} ${voteType}d your report: ${report.title}`,
        relatedReport: reportId,
      });
    }

    return {
      upvotes: report.upvotes.length,
      downvotes: report.downvotes.length,
      userVote: report[currentVoteType].includes(userId) ? voteType : null,
    };
  }

  static async toggleUpvote(reportId: string, userId: string) {
    return await this.toggleVote(reportId, userId, "upvote");
  }

  static async toggleDownvote(reportId: string, userId: string) {
    return await this.toggleVote(reportId, userId, "downvote");
  }

  static async getAlgorithmicReports() {
    const reports = await CrimeReport.find({ isDeleted: false })
      .populate("userId")
      .populate(COMMENT_POPULATE_CONFIG)
      .populate("upvotes")
      .populate("downvotes");

    const scoredReports = reports.map((report) => {
      let score = 0;

      const upvotes = report.upvotes.length;
      const downvotes = report.downvotes.length;
      const totalVotes = upvotes + downvotes;

      if (totalVotes === 0) {
        score += 0;
      } else {
        const z = 1.96;
        const p = upvotes / totalVotes;
        const denominator = totalVotes + z * z;
        const center = (p + (z * z) / (2 * totalVotes)) / denominator;
        const uncertainty =
          z *
          Math.sqrt((p * (1 - p) + (z * z) / (4 * totalVotes)) / denominator);
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

      const recentActivityBonus = 0;
      score += recentActivityBonus;

      return {
        report,
        score: Math.round(score * 100) / 100,
      };
    });

    return scoredReports
      .sort((a, b) => b.score - a.score)
      .map((item) => ({
        ...item.report.toObject(),
        algorithmScore: item.score,
      }));
  }
}
