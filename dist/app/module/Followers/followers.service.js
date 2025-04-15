"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowersService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const followers_model_1 = require("./followers.model");
const notification_model_1 = __importDefault(require("../Notification/notification.model"));
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../utils/logger"));
class FollowersService {
    static followUser(userId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!userId || !followingId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID and Following ID are required");
                }
                if (userId === followingId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Users cannot follow themselves");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId) ||
                    !mongoose_1.Types.ObjectId.isValid(followingId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
                }
                const [currentUserDoc, targetUserDoc] = yield Promise.all([
                    followers_model_1.Followers.findOne({ userId }).populate("userId"),
                    followers_model_1.Followers.findOne({ userId: followingId }).populate("followers"),
                ]);
                const currentUser = currentUserDoc ||
                    (yield followers_model_1.Followers.create({
                        userId,
                        following: [],
                        followers: [],
                    }));
                const targetUser = targetUserDoc ||
                    (yield followers_model_1.Followers.create({
                        userId: followingId,
                        following: [],
                        followers: [],
                    }));
                if (currentUser.following.some((id) => id.toString() === followingId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User already followed");
                }
                yield Promise.all([
                    followers_model_1.Followers.findOneAndUpdate({ userId }, { $addToSet: { following: followingId } }, { new: true }),
                    followers_model_1.Followers.findOneAndUpdate({ userId: followingId }, { $addToSet: { followers: userId } }, { new: true }),
                ]);
                try {
                    yield notification_model_1.default.create({
                        recipient: followingId,
                        sender: userId,
                        type: "follow",
                        title: "New Follower",
                        message: `${((_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.userId) === null || _a === void 0 ? void 0 : _a.name) || "A user"} followed you`,
                        timestamp: new Date(),
                    });
                }
                catch (notificationError) {
                    this.logger.error(`Failed to create notification for follow from ${userId} to ${followingId}:`, notificationError);
                }
                return yield followers_model_1.Followers.findOne({ userId })
                    .populate("userId")
                    .populate("following")
                    .populate("followers");
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error in followUser - ${userId} following ${followingId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to follow user");
            }
        });
    }
    /**
     * Unfollow a user
     * @param userId - ID of the user who is unfollowing
     * @param followingId - ID of the user to be unfollowed
     * @returns Promise resolving to the updated follower document
     * @throws AppError if validation fails or operation cannot complete
     */
    static unfollowUser(userId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !followingId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID and Following ID are required");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId) ||
                    !mongoose_1.Types.ObjectId.isValid(followingId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
                }
                const [userExists, targetExists] = yield Promise.all([
                    followers_model_1.Followers.exists({ userId }),
                    followers_model_1.Followers.exists({ userId: followingId }),
                ]);
                if (!userExists || !targetExists) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                const isFollowing = yield followers_model_1.Followers.exists({
                    userId,
                    following: { $elemMatch: { $eq: followingId } },
                });
                if (!isFollowing) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not followed");
                }
                yield Promise.all([
                    followers_model_1.Followers.findOneAndUpdate({ userId }, { $pull: { following: followingId } }),
                    followers_model_1.Followers.findOneAndUpdate({ userId: followingId }, { $pull: { followers: userId } }),
                ]);
                return yield followers_model_1.Followers.findOne({ userId })
                    .populate("userId")
                    .populate("following")
                    .populate("followers");
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error in unfollowUser - ${userId} unfollowing ${followingId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to unfollow user");
            }
        });
    }
    /**
     * Get followers and following for a user
     * @param userId - ID of the user to get followers for
     * @returns Promise resolving to the follower document with populated fields
     * @throws AppError if the user is not found or operation fails
     */
    static getFollowers(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
                }
                const user = yield followers_model_1.Followers.findOne({ userId })
                    .populate({
                    path: "followers",
                    select: "name avatar email",
                })
                    .populate({
                    path: "following",
                    select: "name avatar email",
                });
                if (!user) {
                    return yield followers_model_1.Followers.create({
                        userId,
                        following: [],
                        followers: [],
                    });
                }
                return user;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error in getFollowers for user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve followers");
            }
        });
    }
    /**
     * Check if a user is following another user
     * @param userId - ID of the potential follower
     * @param followingId - ID of the potential followed user
     * @returns Promise resolving to an object with isFollowing property
     */
    static checkFollow(userId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !followingId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID and Following ID are required");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId) ||
                    !mongoose_1.Types.ObjectId.isValid(followingId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
                }
                const user = yield followers_model_1.Followers.findOne({ userId });
                if (!user) {
                    return { isFollowing: false };
                }
                const isFollowing = user.following.some((id) => id.toString() === followingId);
                return { isFollowing };
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error in checkFollow - ${userId} checking follow status for ${followingId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to check follow status");
            }
        });
    }
    /**
     * Get followers count for a user
     * @param userId - ID of the user
     * @returns Promise resolving to the followers count
     */
    static getFollowersCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
                }
                const user = yield followers_model_1.Followers.findOne({ userId });
                if (!user) {
                    return { followersCount: 0, followingCount: 0 };
                }
                return {
                    followersCount: user.followers.length,
                    followingCount: user.following.length,
                };
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error getting followers count for user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve followers count");
            }
        });
    }
}
exports.FollowersService = FollowersService;
/**
 * Follow a user
 * @param userId - ID of the user who is following
 * @param followingId - ID of the user to be followed
 * @returns Promise resolving to the updated follower document
 * @throws AppError if validation fails or operation cannot complete
 */
FollowersService.logger = new logger_1.default("FollowersService");
