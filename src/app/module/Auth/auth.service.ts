/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import config from "../../../config";
import AppError from "../../errors/AppError";
import { createToken } from "../../utils/tokenGenerateFunction";
import { TUser } from "./auth.interface";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "./auth.model";
import { sendEmail } from "../../utils/sendMail";
import { CrimeReport } from "../CrimeReport/crimeReport.model";
import { ICrimeReport } from "../CrimeReport/crimeReport.interface";

const registerUserIntoDB = async (payload: Partial<TUser>) => {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // Hash the password before storing it in the database
  const saltRounds = Number(config.bcrypt_slat_rounds) || 10;
  const hashedPassword = await bcrypt.hash(
    payload.password as string,
    saltRounds
  );

  const newUser = await User.create({
    ...payload,
    password: hashedPassword,
  });

  const jwtPayload = {
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
  };

  // Generate JWT tokens
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  const registerUser = await User.findOne({ email: newUser.email }).select(
    "-password"
  );

  return {
    result: registerUser,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const loginUserFromDB = async (payload: Partial<TUser>) => {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user?.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
  }

  // Checking if the password is correct
  const isPasswordValid = await bcrypt.compare(
    payload.password!,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError(httpStatus.FORBIDDEN, "Incorrect password");
  }

  const jwtPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  const loginUser = await User.findOne({ email: user.email }).select(
    "-password"
  );

  return {
    result: loginUser,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const resetLinkIntoDB = async ({ email }: { email: string }) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  if (user.isDeleted === true) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted!");
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
  }

  const jwtPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    "10m"
  );

  const resetLink = `${config.reset_link_url}?email=${user.email}&token=${resetToken}`;

  // Send email to the user with the reset link
  await sendEmail(user.email, resetLink);
};

const forgotPasswordIntoDB = async (payload: {
  email: string;
  newPassword: string;
  token: string;
}) => {
  console.log("payload=>", payload);
  const user = await User.findOne({ email: payload?.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  if (user.isDeleted === true) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted!");
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
  }

  // Check if token is valid
  const decoded = jwt.verify(
    payload.token,
    config.jwt_access_secret as string
  ) as {
    id: string;
    email: string;
    role: string;
  };

  if (payload.email !== decoded.email) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is forbidden!");
  }

  const newHashPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_slat_rounds)
  );

  const result = await User.findOneAndUpdate(
    { _id: decoded.id, role: decoded.role },
    {
      password: newHashPassword,
    },
    { new: true }
  );

  return result;
};

const changePasswordIntoDB = async (
  payload: { email: string; newPassword: string },
  token: string
) => {
  console.log(payload);
  const user = await User.findOne({ email: payload?.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  if (user.isDeleted === true) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted!");
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  // Check if token is valid
  const decoded = jwt.verify(token, config.jwt_access_secret as string) as {
    id: string;
    email: string;
    role: string;
  };

  if (payload.email !== decoded.email) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is forbidden!");
  }

  const newHashPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_slat_rounds)
  );

  const result = await User.findOneAndUpdate(
    { _id: decoded.id, role: decoded.role },
    {
      password: newHashPassword,
    },
    { new: true }
  );

  return result;
};

const getMeFromDB = async (payload: { email: string; reports: boolean }) => {
  const user = await User.findOne({ email: payload.email }).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const data: { user: TUser; userReports?: ICrimeReport[] } = {
    user,
  };

  if (payload.reports) {
    const userReports = await CrimeReport.find({ userId: user._id })
      .populate("userId")
      .sort({ createdAt: -1 });
    data.userReports = userReports;
  }
  return data;
};

export const AuthServices = {
  registerUserIntoDB,
  loginUserFromDB,
  resetLinkIntoDB,
  forgotPasswordIntoDB,
  changePasswordIntoDB,
  getMeFromDB,
};
