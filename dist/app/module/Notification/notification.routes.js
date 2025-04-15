"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const notification_controller_1 = __importDefault(require("./notification.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_utils_1 = require("../Auth/auth.utils");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), notification_controller_1.default.getNotifications);
router.patch("/mark-all-read", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), notification_controller_1.default.markAllAsRead);
router.patch("/read/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), notification_controller_1.default.markAsRead);
router.delete("/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), notification_controller_1.default.deleteNotification);
exports.NotificationRoutes = router;
