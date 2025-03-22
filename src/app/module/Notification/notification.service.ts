import { FilterQuery } from "mongoose";
import Notification from "./notification.model";
import { NotificationType, TNotification } from "./notification.interface";

import { startSession } from "mongoose";
import Logger from "../../utils/logger";

class NotificationService {
  private logger = new Logger("NotificationService");

  /**
   * Creates a new notification
   * @param data Notification data
   * @returns Created notification
   */
  async createNotification(data: {
    recipient: string;
    sender: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedReport?: string;
    relatedComment?: string;
  }): Promise<TNotification> {
    this.logger.debug("Creating notification", {
      recipient: data.recipient,
      type: data.type,
    });

    if (
      !data.recipient ||
      !data.sender ||
      !data.type ||
      !data.title ||
      !data.message
    ) {
      throw new Error("Missing required notification fields");
    }

    const session = await startSession();
    try {
      session.startTransaction();

      const notification = await Notification.create(
        [
          {
            ...data,
            recipient: data.recipient,
            sender: data.sender,
            relatedReport: data.relatedReport || null,
            relatedComment: data.relatedComment || null,
            isRead: false,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      this.logger.info("Notification created successfully", {
        id: notification[0]._id,
      });

      return notification[0];
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Failed to create notification", { error, data });
      throw new Error("Failed to create notification");
    } finally {
      session.endSession();
    }
  }

  /**
   * Retrieves notifications for a user with pagination
   * @param userId User ID
   * @param options Pagination options
   * @returns List of notifications and count
   */
  async getNotifications(
    userId: string,
    options: { page?: number; limit?: number; onlyUnread?: boolean } = {}
  ): Promise<{ notifications: TNotification[]; total: number }> {
    try {
      this.logger.debug("Fetching notifications", { userId, options });

      if (!userId) {
        throw new Error("User ID is required");
      }

      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const query: FilterQuery<TNotification> = {
        recipient: userId,
        isDeleted: false,
      };

      if (options.onlyUnread) {
        query.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sender", "name profileImage")
          .populate("relatedReport", "title")
          .populate("relatedComment", "comment")
          .lean(),
        Notification.countDocuments(query),
      ]);

      this.logger.info("Notifications fetched successfully", {
        userId,
        count: notifications.length,
        total,
      });

      return { notifications, total };
    } catch (error) {
      this.logger.error("Failed to fetch notifications", { error, userId });
      throw new Error("Failed to fetch notifications");
    }
  }

  /**
   * Marks a notification as read
   * @param notificationId Notification ID
   * @param userId User ID
   * @returns Updated notification
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<TNotification> {
    try {
      this.logger.debug("Marking notification as read", {
        notificationId,
        userId,
      });

      if (!notificationId || !userId) {
        throw new Error("Notification ID and User ID are required");
      }

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: userId,
        },
        {
          isRead: true,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!notification) {
        throw new Error(
          "Notification not found or not accessible by this user"
        );
      }

      this.logger.info("Notification marked as read", { notificationId });

      return notification;
    } catch (error) {
      this.logger.error("Failed to mark notification as read", {
        error,
        notificationId,
        userId,
      });

      if (error instanceof Error || error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Marks all notifications for a user as read
   * @param userId User ID
   * @returns Result of the operation
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug("Marking all notifications as read", { userId });

      if (!userId) {
        throw new Error("User ID is required");
      }

      const result = await Notification.updateMany(
        {
          recipient: userId,
          isRead: false,
          isDeleted: false,
        },
        {
          isRead: true,
          updatedAt: new Date(),
        }
      );

      this.logger.info("All notifications marked as read", {
        userId,
        modifiedCount: result.modifiedCount,
      });

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read", {
        error,
        userId,
      });

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Soft deletes a notification
   * @param notificationId Notification ID
   * @param userId User ID
   * @returns Result of the operation
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      this.logger.debug("Deleting notification", { notificationId, userId });

      if (!notificationId || !userId) {
        throw new Error("Notification ID and User ID are required");
      }

      const result = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: userId,
          isDeleted: false,
        },
        {
          isDeleted: true,
          updatedAt: new Date(),
        }
      );

      if (!result) {
        throw new Error("Notification not found or already deleted");
      }

      this.logger.info("Notification deleted successfully", { notificationId });

      return { success: true };
    } catch (error) {
      this.logger.error("Failed to delete notification", {
        error,
        notificationId,
        userId,
      });

      if (error instanceof Error || error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Permanently deletes old notifications based on age
   * @param olderThan Date threshold in days
   * @returns Number of deleted notifications
   */
  async purgeOldNotifications(
    olderThan: number = 90
  ): Promise<{ deletedCount: number }> {
    const session = await startSession();
    try {
      this.logger.debug("Purging old notifications", { olderThan });
      session.startTransaction();

      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - olderThan);

      const result = await Notification.deleteMany(
        {
          createdAt: { $lt: thresholdDate },
          isDeleted: true,
        },
        { session }
      );

      await session.commitTransaction();

      this.logger.info("Old notifications purged", {
        deletedCount: result.deletedCount,
      });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Failed to purge old notifications", {
        error,
        olderThan,
      });
      throw new Error("Failed to purge old notifications");
    } finally {
      session.endSession();
    }
  }

  /**
   * Gets count of unread notifications for a user
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    try {
      this.logger.debug("Getting unread notification count", { userId });

      if (!userId) {
        throw new Error("User ID is required");
      }

      const count = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
        isDeleted: false,
      });

      this.logger.info("Unread notification count retrieved", {
        userId,
        count,
      });

      return { count };
    } catch (error) {
      this.logger.error("Failed to get unread notification count", {
        error,
        userId,
      });

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to get unread notification count");
    }
  }
}

export default new NotificationService();
