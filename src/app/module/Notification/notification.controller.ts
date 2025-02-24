import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import NotificationService from "./notification.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

class NotificationController {
  static getNotifications = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.user;
    const notifications = await NotificationService.getNotifications(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  });

  static markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await NotificationService.markAsRead(id, userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  });

  static markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const notifications = await NotificationService.markAllAsRead(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All notifications marked as read",
      data: notifications,
    });
  });

  static deleteNotification = catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const userId = req.user.id;
      const notification = await NotificationService.deleteNotification(
        id,
        userId
      );
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification deleted successfully",
        data: notification,
      });
    }
  );
}

export default NotificationController;
