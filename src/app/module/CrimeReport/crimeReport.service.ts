import { ICrimeReport } from "./crimeReport.interface";
import httpStatus from "http-status";
import { CrimeReport } from "./crimeReport.model";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/queryBuilder";
import { NvidiaImageDescription } from "../../../hooks/nvidia.neva-22b";
import { COMMENT_POPULATE_CONFIG } from "./crimeReport.config";
import User from "../Auth/auth.model";
import { TUser } from "../Auth/auth.interface";
import { ObjectId } from "mongoose";

export class CrimeReportService {
  static async createCrimeReport(
    data: Partial<ICrimeReport>
  ): Promise<ICrimeReport> {
    return await CrimeReport.create(data);
  }

  static async getAllCrimeReports(): Promise<ICrimeReport[]> {
    return await CrimeReport.find({ isDeleted: false })
      .populate("userId")
      .populate(COMMENT_POPULATE_CONFIG)
      .populate("upvotes")
      .populate("downvotes")
      .sort({ createdAt: -1 });
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

  static async getRecentReports() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    const recentReports = await CrimeReport.find({
      createdAt: { $gte: twentyFourHoursAgo },
    })
      .populate("userId")
      .sort({ createdAt: -1 });

    if (!recentReports.length) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No reports found in the past 24 hours"
      );
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

  static async queryCrimeReports(query: Record<string, unknown>) {
    const crimeReportQuery = CrimeReport.find({ isDeleted: false })
      .populate("userId")
      .populate(COMMENT_POPULATE_CONFIG)
      .populate("upvotes")
      .populate("downvotes");

    if (query.startDate && query.endDate) {
      crimeReportQuery.find({
        crimeTime: {
          $gte: new Date(query.startDate as string),
          $lte: new Date(query.endDate as string),
        },
      });

      delete query.startDate;
      delete query.endDate;
    }

    const crimeReportBuilder = new QueryBuilder(crimeReportQuery, query)
      .search(["title", "description", "division", "district"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await crimeReportBuilder.modelQuery;
    const meta = await crimeReportBuilder.countTotal();

    return {
      data: result,
      meta,
    };
  }

  static async analyzeCrimeReport(data: {
    imageUrl: string[];
    division: string;
    district: string;
  }) {
    const { imageUrl, division, district } = data;

    const requiredParams = {
      imageUrl,
      division,
      district,
    };

    for (const [param, value] of Object.entries(requiredParams)) {
      if (!value) {
        console.log(`${param} is a mandatory parameter`);
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Missing required parameter: ${param}`
        );
      }
    }

    try {
      const report = await NvidiaImageDescription(
        imageUrl[0] as string,
        division as string,
        district as string
      );

      return report;
    } catch (err) {
      console.error(err);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to generate the report"
      );
    }
  }

  static async toggleVote(
    reportId: string,
    userId: string,
    voteType: "upvote" | "downvote"
  ) {
    const report = await CrimeReport.findById(reportId);

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

    if (report[currentVoteType].includes(userId)) {
      report[currentVoteType] = report[currentVoteType].filter(
        (id) => id.toString() !== userId
      );
    } else {
      report[currentVoteType].push(userId);
    }

    await report.save();

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
}
