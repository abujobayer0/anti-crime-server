import Notification from "./notification.model";
import { NotificationType } from "./notification.interface";

class NotificationService {
  async createNotification(data: {
    recipient: string;
    sender: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedReport?: string;
    relatedComment?: string;
  }) {
    try {
      const notification = await Notification.create({
        ...data,
        recipient: data.recipient,
        sender: data.sender,
        relatedReport: data.relatedReport ? data.relatedReport : undefined,
        relatedComment: data.relatedComment ? data.relatedComment : undefined,
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getNotifications(userId: string) {
    return Notification.find({
      recipient: userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name profileImage")
      .populate("relatedReport", "title")
      .populate("relatedComment", "comment");
  }

  async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        isRead: true,
      },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  }

  async deleteNotification(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isDeleted: true }
    );
  }
}

export default new NotificationService();
