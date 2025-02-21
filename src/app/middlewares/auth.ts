import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/AppError";
import catchAsync from "../utils/catchAsync";
import { verifyToken } from "../utils/tokenGenerateFunction";
import config from "../../config";
import { userRole } from "../module/Auth/auth.utils";
import User from "../module/Auth/auth.model";

const Auth = (...requiredRoles: (keyof typeof userRole)[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
    }

    // Extract the token without "Bearer " prefix
    const tokenWithoutBearer = token.split(" ")[1];
    if (!tokenWithoutBearer) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token format!");
    }

    const decoded = verifyToken(
      tokenWithoutBearer,
      config.jwt_access_secret as string
    ) as JwtPayload;

    const { role, email, iat } = decoded;

    // checking if the user exists
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
    }

    // checking if the user is banned
    if (user?.isBanned) {
      throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default Auth;
