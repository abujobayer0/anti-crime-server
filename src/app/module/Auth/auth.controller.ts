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

const resetLink = catchAsync(async (req, res) => {
  const result = await AuthServices.resetLinkIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reset link send successfully",
    data: result,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgotPasswordIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password forgot successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const result = await AuthServices.getMeFromDB({
    email: (req.user as { email: string }).email,
    reports: req.query.reports === "true" ? true : false,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});
const changePassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await AuthServices.changePasswordIntoDB(
    req.body,
    token as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password change successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  resetLink,
  forgetPassword,
  changePassword,
  getMe,
};
