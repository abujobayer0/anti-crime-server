import { ICrimeReport } from "./crimeReport.interface";
import httpStatus from "http-status";
import { CrimeReport } from "./crimeReport.model";
import AppError from "../../errors/AppError";

export class CrimeReportService {
  static async createCrimeReport(data: ICrimeReport): Promise<ICrimeReport> {
    return await CrimeReport.create(data);
  }

  static async getAllCrimeReports(): Promise<ICrimeReport[]> {
    return await CrimeReport.find({ isDeleted: false }).populate("comments");
  }

  static async getCrimeReportById(id: string): Promise<ICrimeReport | null> {
    const report = await CrimeReport.findById(id).populate("comments");
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
}
