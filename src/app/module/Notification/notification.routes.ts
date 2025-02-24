import express from "express";
import NotificationController from "./notification.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";
const router = express.Router();

router.get(
  "/",
  Auth(userRole.admin, userRole.user),
  NotificationController.getNotifications
);
router.patch(
  "/mark-all-read",
  Auth(userRole.admin, userRole.user),
  NotificationController.markAllAsRead
);

router.patch(
  "/read/:id",
  Auth(userRole.admin, userRole.user),
  NotificationController.markAsRead
);
router.delete(
  "/:id",
  Auth(userRole.admin, userRole.user),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
