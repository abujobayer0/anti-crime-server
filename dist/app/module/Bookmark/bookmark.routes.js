"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkRoutes = void 0;
const express_1 = require("express");
const auth_utils_1 = require("../Auth/auth.utils");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const bookmark_controller_1 = require("./bookmark.controller");
const router = (0, express_1.Router)();
router.get("/", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), bookmark_controller_1.BookmarkController.getBookmarks);
router.get("/reportId", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), bookmark_controller_1.BookmarkController.checkBookmarked);
router.post("/:reportId", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), bookmark_controller_1.BookmarkController.createBookmark);
router.delete("/:bookmarkId", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), bookmark_controller_1.BookmarkController.deleteBookmark);
exports.BookmarkRoutes = router;
