import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Followers } from "./followers.model";
import Notification from "../Notification/notification.model";
import { Schema } from "mongoose";
export class FollowersService {
  static async followUser(userId: string, followingId: string) {
    const [user, targetUser] = await Promise.all<any>([
      Followers.findOne({ userId }).populate("userId"),
      Followers.findOne({ userId: followingId }).populate("followers"),
    ]);

    const currentUser =
      user ||
      (await Followers.create({
        userId,
        following: [],
        followers: [],
      }));

    const followedUser =
      targetUser ||
      (await Followers.create({
        userId: followingId,
        following: [],
        followers: [],
      }));

    if (currentUser.following.includes(followingId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "User already followed");
    }

    currentUser.following.push(followingId);
    followedUser.followers.push(userId);

    await Promise.all([currentUser.save(), followedUser.save()]);
    await Notification.create({
      recipient: followingId,
      sender: userId,
      type: "follow",
      title: "New Follower",
      message: `${user?.userId?.name} followed you`,
    });
    return currentUser;
  }

  static async unfollowUser(userId: string, followingId: string) {
    const [user, targetUser] = await Promise.all<any>([
      Followers.findOne({ userId }),
      Followers.findOne({ userId: followingId }),
    ]);

    if (!user || !targetUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.following.includes(followingId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "User not followed");
    }

    user.following = user.following.filter(
      (id: Schema.Types.ObjectId) => id.toString() !== followingId
    );
    targetUser.followers = targetUser.followers.filter(
      (id: Schema.Types.ObjectId) => id.toString() !== userId
    );
    await Promise.all([user.save(), targetUser.save()]);

    return user;
  }
  static async getFollowers(userId: string) {
    const user = await Followers.findOne({ userId })
      .populate("followers")
      .populate("following");

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
  }
  static async checkFollow(userId: string, followingId: string) {
    const user = await Followers.findOne({ userId });
    if (!user) {
      return { isFollowing: false };
    }

    const isFollowing = user.following.some(
      (id: Schema.Types.ObjectId) => id.toString() === followingId
    );

    return { isFollowing };
  }
}
