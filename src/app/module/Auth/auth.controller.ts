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

const changePassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const tokenWithoutBearer = token?.split(" ")[1];
  const result = await AuthServices.changePasswordIntoDB(
    req.body,
    req.user.email,
    tokenWithoutBearer as string
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
};
