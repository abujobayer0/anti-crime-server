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
    console.log("Received Token:", token);
    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
    }

    const decoded = verifyToken(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload;

    const { role, email, iat } = decoded;

    console.log("decoded user=> ", decoded);

    // checking if the user is exist
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
    }
    // checking if the user is already deleted

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
