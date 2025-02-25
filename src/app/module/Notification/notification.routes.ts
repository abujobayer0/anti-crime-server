import express from "express";
import NotificationController from "./notification.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";
const router = express.Router();

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  NotificationController.getNotifications
);
router.patch(
  "/mark-all-read",
  Auth(userRole.user, userRole.admin),
  NotificationController.markAllAsRead
);

router.patch(
  "/read/:id",
  Auth(userRole.user, userRole.admin),
  NotificationController.markAsRead
);
router.delete(
  "/:id",
  Auth(userRole.user, userRole.admin),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
