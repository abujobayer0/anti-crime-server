import { ICrimeReport } from "./crimeReport.interface";
import httpStatus from "http-status";
import { CrimeReport } from "./crimeReport.model";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/queryBuilder";
import { NvidiaImageDescription } from "../../../hooks/nvidia.neva-22b";

export class CrimeReportService {
  static async createCrimeReport(
    data: Partial<ICrimeReport>
  ): Promise<ICrimeReport> {
    return await CrimeReport.create(data);
  }

  static async getAllCrimeReports(): Promise<ICrimeReport[]> {
    return await CrimeReport.find({ isDeleted: false })
      .populate("userId")
      .populate("comments")
      .sort({ createdAt: -1 });
  }

  static async getCrimeReportById(id: string): Promise<ICrimeReport | null> {
    const report = await CrimeReport.findById(id)
      .populate("userId")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "name profileImage",
        },
      });

    if (!report)
      throw new AppError(httpStatus.NOT_FOUND, "Crime Report not found");
    return report;
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
    const crimeReportQuery = CrimeReport.find({ isDeleted: false }).populate(
      "userId"
    );

    // Handle date range filter
    if (query.startDate && query.endDate) {
      crimeReportQuery.find({
        crimeTime: {
          $gte: new Date(query.startDate as string),
          $lte: new Date(query.endDate as string),
        },
      });
      // Remove these fields so they don't interfere with the general filter
      delete query.startDate;
      delete query.endDate;
    }

    const crimeReportBuilder = new QueryBuilder(crimeReportQuery, query)
      .search(["title", "description"])
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
}
