import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { FollowersService } from "./followers.service";
import sendResponse from "../../utils/sendResponse";
import { Schema } from "mongoose";

class FollowersController {
  static getFollowers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const data = await FollowersService.getFollowers(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Followers fetched successfully",
      data: data,
    });
  });
  static checkFollow = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const followingId = req.params.id;
    const data = await FollowersService.checkFollow(userId, followingId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Follow status checked successfully",
      data: data,
    });
  });

  static followUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const followingId = req.params.id;
    const data = await FollowersService.followUser(userId, followingId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User followed successfully",
      data: data,
    });
  });

  static unfollowUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const followingId = req.params.id;
    const data = await FollowersService.unfollowUser(userId, followingId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User unfollowed successfully",
      data: data,
    });
  });
}

export default FollowersController;
