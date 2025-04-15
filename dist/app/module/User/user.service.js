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
exports.UserService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const auth_model_1 = __importDefault(require("../Auth/auth.model"));
const logger_1 = __importDefault(require("../../utils/logger"));
class UserService {
    /**
     * Retrieves all non-deleted users from the database
     * @returns Promise resolving to an array of users with passwords excluded
     * @throws AppError if there's an error during retrieval
     */
    static getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Retrieving all active users");
                const users = yield auth_model_1.default.find({ isDeleted: false }).select("-password");
                this.logger.info(`Retrieved ${users.length} active users`);
                return users;
            }
            catch (error) {
                this.logger.error(`Error retrieving users: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve users");
            }
        });
    }
    /**
     * Retrieves all banned users who are not deleted
     * @returns Promise resolving to an array of banned users with passwords excluded
     * @throws AppError if there's an error during retrieval
     */
    static getBannedUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info("Retrieving all banned users");
                const bannedUsers = yield auth_model_1.default.find({
                    isDeleted: false,
                    isBanned: true,
                }).select("-password");
                this.logger.info(`Retrieved ${bannedUsers.length} banned users`);
                return bannedUsers;
            }
            catch (error) {
                this.logger.error(`Error retrieving banned users: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve banned users");
            }
        });
    }
    /**
     * Retrieves a user by their ID
     * @param id - The ID of the user to retrieve
     * @returns Promise resolving to the user with password excluded or null if not found
     * @throws AppError if user not found or there's an error during retrieval
     */
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Retrieving user with ID: ${id}`);
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const user = yield auth_model_1.default.findById(id).select("-password");
                if (!user) {
                    this.logger.warn(`User with ID ${id} not found`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                this.logger.info(`Successfully retrieved user with ID: ${id}`);
                return user;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error retrieving user: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
            }
        });
    }
    /**
     * Retrieves the current user for database operations
     * @param id - The ID of the current user
     * @returns Promise resolving to the user with password excluded
     * @throws AppError if user not found or there's an error during retrieval
     */
    static getMeForDB(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Retrieving current user with ID: ${id} for DB operations`);
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const user = yield auth_model_1.default.findById(id).select("-password");
                if (!user) {
                    this.logger.warn(`Current user with ID ${id} not found`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                this.logger.info(`Successfully retrieved current user with ID: ${id}`);
                return user;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error retrieving current user: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to retrieve current user");
            }
        });
    }
    /**
     * Updates a user by their ID
     * @param id - The ID of the user to update
     * @param updates - Partial user object containing fields to update
     * @returns Promise resolving to the updated user with password excluded
     * @throws AppError if user not found or there's an error during update
     */
    static updateUserById(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Updating user with ID: ${id}`);
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                if (!updates || Object.keys(updates).length === 0) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No update data provided");
                }
                const updatedUser = yield auth_model_1.default.findByIdAndUpdate(id, updates, {
                    new: true,
                }).select("-password");
                if (!updatedUser) {
                    this.logger.warn(`User with ID ${id} not found for update`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                this.logger.info(`Successfully updated user with ID: ${id}`);
                return updatedUser;
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error updating user: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update user");
            }
        });
    }
    /**
     * Soft deletes a user by setting isDeleted flag to true
     * @param id - The ID of the user to delete
     * @returns Promise resolving to void
     * @throws AppError if user not found or there's an error during deletion
     */
    static deleteUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Soft deleting user with ID: ${id}`);
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const user = yield auth_model_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
                if (!user) {
                    this.logger.warn(`User with ID ${id} not found for deletion`);
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
                }
                this.logger.info(`Successfully soft deleted user with ID: ${id}`);
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                this.logger.error(`Error deleting user: ${error.message}`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete user");
            }
        });
    }
}
exports.UserService = UserService;
UserService.logger = new logger_1.default("UserService");
