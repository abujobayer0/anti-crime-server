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

  static analyzeCrimeReport = catchAsync(
    async (req: Request, res: Response) => {
      const report = await CrimeReportService.analyzeCrimeReport(
        req.body as {
          images: Express.Multer.File[];
          division: string;
          district: string;
        }
      );

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Crime report analyzed successfully",
        data: report,
      });
    }
  );

  static queryCrimeReports = catchAsync(async (req: Request, res: Response) => {
    const reports = await CrimeReportService.queryCrimeReports(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Crime reports fetched successfully",
      data: reports,
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

  static toggleUpvote = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await CrimeReportService.toggleUpvote(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Vote updated successfully",
      data: result,
    });
  });

  static toggleDownvote = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await CrimeReportService.toggleDownvote(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Vote updated successfully",
      data: result,
    });
  });
}
