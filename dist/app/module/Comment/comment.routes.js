"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRoutes = void 0;
const express_1 = require("express");
const comment_controller_1 = require("./comment.controller");
const auth_utils_1 = require("../Auth/auth.utils");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.post("/:reportId/comment", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), comment_controller_1.CommentController.createComment);
router.patch("/:commentId/update", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), comment_controller_1.CommentController.updateComment);
router.delete("/:commentId/delete", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), comment_controller_1.CommentController.deleteComment);
exports.CommentRoutes = router;
