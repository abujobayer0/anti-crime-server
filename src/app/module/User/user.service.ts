import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { TUser } from "../Auth/auth.interface";
import User from "../Auth/auth.model";
import Logger from "../../utils/logger";

export class UserService {
  private static readonly logger = new Logger("UserService");

  /**
   * Retrieves all non-deleted users from the database
   * @returns Promise resolving to an array of users with passwords excluded
   * @throws AppError if there's an error during retrieval
   */
  public static async getAllUsers(): Promise<TUser[]> {
    try {
      this.logger.info("Retrieving all active users");

      const users = await User.find({ isDeleted: false }).select("-password");

      this.logger.info(`Retrieved ${users.length} active users`);
      return users;
    } catch (error: any) {
      this.logger.error(`Error retrieving users: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve users"
      );
    }
  }

  /**
   * Retrieves all banned users who are not deleted
   * @returns Promise resolving to an array of banned users with passwords excluded
   * @throws AppError if there's an error during retrieval
   */
  public static async getBannedUsers(): Promise<TUser[]> {
    try {
      this.logger.info("Retrieving all banned users");

      const bannedUsers = await User.find({
        isDeleted: false,
        isBanned: true,
      }).select("-password");

      this.logger.info(`Retrieved ${bannedUsers.length} banned users`);
      return bannedUsers;
    } catch (error: any) {
      this.logger.error(
        `Error retrieving banned users: ${error.message}`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve banned users"
      );
    }
  }

  /**
   * Retrieves a user by their ID
   * @param id - The ID of the user to retrieve
   * @returns Promise resolving to the user with password excluded or null if not found
   * @throws AppError if user not found or there's an error during retrieval
   */
  public static async getUserById(id: string): Promise<TUser> {
    try {
      this.logger.info(`Retrieving user with ID: ${id}`);

      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const user = await User.findById(id).select("-password");

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      this.logger.info(`Successfully retrieved user with ID: ${id}`);
      return user;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error retrieving user: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve user"
      );
    }
  }

  /**
   * Retrieves the current user for database operations
   * @param id - The ID of the current user
   * @returns Promise resolving to the user with password excluded
   * @throws AppError if user not found or there's an error during retrieval
   */
  public static async getMeForDB(id: string): Promise<TUser> {
    try {
      this.logger.info(
        `Retrieving current user with ID: ${id} for DB operations`
      );

      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const user = await User.findById(id).select("-password");

      if (!user) {
        this.logger.warn(`Current user with ID ${id} not found`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      this.logger.info(`Successfully retrieved current user with ID: ${id}`);
      return user;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Error retrieving current user: ${error.message}`,
        error
      );
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve current user"
      );
    }
  }

  /**
   * Updates a user by their ID
   * @param id - The ID of the user to update
   * @param updates - Partial user object containing fields to update
   * @returns Promise resolving to the updated user with password excluded
   * @throws AppError if user not found or there's an error during update
   */
  public static async updateUserById(
    id: string,
    updates: Partial<TUser>
  ): Promise<TUser> {
    try {
      this.logger.info(`Updating user with ID: ${id}`);

      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No update data provided");
      }

      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
      }).select("-password");

      if (!updatedUser) {
        this.logger.warn(`User with ID ${id} not found for update`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      this.logger.info(`Successfully updated user with ID: ${id}`);
      return updatedUser;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error updating user: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update user"
      );
    }
  }

  /**
   * Soft deletes a user by setting isDeleted flag to true
   * @param id - The ID of the user to delete
   * @returns Promise resolving to void
   * @throws AppError if user not found or there's an error during deletion
   */
  public static async deleteUserById(id: string): Promise<void> {
    try {
      this.logger.info(`Soft deleting user with ID: ${id}`);

      if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
      }

      const user = await User.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!user) {
        this.logger.warn(`User with ID ${id} not found for deletion`);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      this.logger.info(`Successfully soft deleted user with ID: ${id}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Error deleting user: ${error.message}`, error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete user"
      );
    }
  }
}
