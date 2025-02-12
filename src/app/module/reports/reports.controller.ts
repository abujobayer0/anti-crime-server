import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReportsServices } from "./reports.service";

const create = catchAsync(async (req, res) => {
  const result = await ReportsServices.createReportToDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report created successfully",
    data: result,
  });
});

export const ReportsController = {
  create,
};
