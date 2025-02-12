import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CrimeReportService } from "./crimeReport.service";

export class CrimeReportController {
  static createCrimeReport = catchAsync(async (req: Request, res: Response) => {
    const report = await CrimeReportService.createCrimeReport(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Crime report created successfully",
      data: report,
    });
  });

  static getAllCrimeReports = catchAsync(
    async (req: Request, res: Response) => {
      const reports = await CrimeReportService.getAllCrimeReports();
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Crime reports fetched successfully",
        data: reports,
      });
    }
  );

  static getCrimeReportById = catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const report = await CrimeReportService.getCrimeReportById(id);
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Crime report fetched successfully",
        data: report,
      });
    }
  );

  static updateCrimeReport = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedReport = await CrimeReportService.updateCrimeReport(
      id,
      req.body
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Crime report updated successfully",
      data: updatedReport,
    });
  });

  static deleteCrimeReport = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await CrimeReportService.deleteCrimeReport(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Crime report deleted successfully",
    });
  });
}
