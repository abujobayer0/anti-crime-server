import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Followers } from "./followers.model";
import Notification from "../Notification/notification.model";
import { Schema, Types } from "mongoose";
import Logger from "../../utils/logger";

interface FollowStatusResponse {
  isFollowing: boolean;
}

export class FollowersService {
  /**
   * Follow a user
   * @param userId - ID of the user who is following
   * @param followingId - ID of the user to be followed
   * @returns Promise resolving to the updated follower document
   * @throws AppError if validation fails or operation cannot complete
   */
  private static readonly logger = new Logger("FollowersService");

  static async followUser(userId: string, followingId: string) {
    try {
      if (!userId || !followingId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User ID and Following ID are required"
        );
      }

      if (userId === followingId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Users cannot follow themselves"
        );
      }

      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID format");
      }

      const [currentUserDoc, targetUserDoc] = await Promise.all<any>([
        Followers.findOne({ userId }).populate("userId"),
        Followers.findOne({ userId: followingId }).populate("followers"),
      ]);

      const currentUser =
        currentUserDoc ||
        (await Followers.create({
          userId,
          following: [],
          followers: [],
        }));

      const targetUser =
        targetUserDoc ||
        (await Followers.create({
          userId: followingId,
          following: [],
          followers: [],
        }));

      if (
        currentUser.following.some(
          (id: Schema.Types.ObjectId) => id.toString() === followingId
        )
      ) {
        throw new AppError(httpStatus.BAD_REQUEST, "User already followed");
      }

      await Promise.all([
        Followers.findOneAndUpdate(
          { userId },
          { $addToSet: { following: followingId } },
          { new: true }
        ),
        Followers.findOneAndUpdate(
          { userId: followingId },
          { $addToSet: { followers: userId } },
          { new: true }
        ),
      ]);

      try {
        await Notification.create({
          recipient: followingId,
          sender: userId,
          type: "follow",
          title: "New Follower",
          message: `${currentUser?.userId?.name || "A user"} followed you`,
          timestamp: new Date(),
        });
      } catch (notificationError: any) {
        this.logger.error(
          `Failed to create notification for follow from ${userId} to ${followingId}:`,
          notificationError
        );
      }

      return await Followers.findOne({ userId })
        .populate("userId")
        .populate("following")
        .populate("followers");
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error in followUser - ${userId} following ${followingId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to follow user"
      );
    }
  }

  /**
   * Unfollow a user
   * @param userId - ID of the user who is unfollowing
   * @param followingId - ID of the user to be unfollowed
   * @returns Promise resolving to the updated follower document
   * @throws AppError if validation fails or operation cannot complete
   */
  static async unfollowUser(userId: string, followingId: string) {
    try {
      if (!userId || !followingId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User ID and Following ID are required"
        );
      }

      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID format");
      }

      const [userExists, targetExists] = await Promise.all([
        Followers.exists({ userId }),
        Followers.exists({ userId: followingId }),
      ]);

      if (!userExists || !targetExists) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      const isFollowing = await Followers.exists({
        userId,
        following: { $elemMatch: { $eq: followingId } },
      });

      if (!isFollowing) {
        throw new AppError(httpStatus.BAD_REQUEST, "User not followed");
      }

      await Promise.all([
        Followers.findOneAndUpdate(
          { userId },
          { $pull: { following: followingId } }
        ),
        Followers.findOneAndUpdate(
          { userId: followingId },
          { $pull: { followers: userId } }
        ),
      ]);

      return await Followers.findOne({ userId })
        .populate("userId")
        .populate("following")
        .populate("followers");
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error in unfollowUser - ${userId} unfollowing ${followingId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to unfollow user"
      );
    }
  }

  /**
   * Get followers and following for a user
   * @param userId - ID of the user to get followers for
   * @returns Promise resolving to the follower document with populated fields
   * @throws AppError if the user is not found or operation fails
   */
  static async getFollowers(userId: string) {
    try {
      if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID format");
      }

      const user = await Followers.findOne({ userId })
        .populate({
          path: "followers",
          select: "name avatar email",
        })
        .populate({
          path: "following",
          select: "name avatar email",
        });

      if (!user) {
        return await Followers.create({
          userId,
          following: [],
          followers: [],
        });
      }

      return user;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error in getFollowers for user ${userId}:`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve followers"
      );
    }
  }

  /**
   * Check if a user is following another user
   * @param userId - ID of the potential follower
   * @param followingId - ID of the potential followed user
   * @returns Promise resolving to an object with isFollowing property
   */
  static async checkFollow(
    userId: string,
    followingId: string
  ): Promise<FollowStatusResponse> {
    try {
      if (!userId || !followingId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User ID and Following ID are required"
        );
      }

      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID format");
      }

      const user = await Followers.findOne({ userId });

      if (!user) {
        return { isFollowing: false };
      }

      const isFollowing = user.following.some(
        (id: Schema.Types.ObjectId) => id.toString() === followingId
      );

      return { isFollowing };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error in checkFollow - ${userId} checking follow status for ${followingId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to check follow status"
      );
    }
  }

  /**
   * Get followers count for a user
   * @param userId - ID of the user
   * @returns Promise resolving to the followers count
   */
  static async getFollowersCount(
    userId: string
  ): Promise<{ followersCount: number; followingCount: number }> {
    try {
      if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID format");
      }

      const user = await Followers.findOne({ userId });

      if (!user) {
        return { followersCount: 0, followingCount: 0 };
      }

      return {
        followersCount: user.followers.length,
        followingCount: user.following.length,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error getting followers count for user ${userId}:`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve followers count"
      );
    }
  }
}
