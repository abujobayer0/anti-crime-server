import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

const register = catchAsync(async (req, res) => {
  const result = await AuthServices.registerUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUserFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
};
