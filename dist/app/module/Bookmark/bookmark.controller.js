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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const bookmark_service_1 = require("./bookmark.service");
class BookmarkController {
}
exports.BookmarkController = BookmarkController;
_a = BookmarkController;
BookmarkController.createBookmark = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { reportId } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const bookmark = yield bookmark_service_1.BookmarkService.createBookmark(reportId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Bookmark created successfully",
        data: bookmark,
    });
}));
BookmarkController.getBookmarks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const bookmark = yield bookmark_service_1.BookmarkService.getBookmarksByUserId(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Bookmark get successfully",
        data: bookmark,
    });
}));
BookmarkController.checkBookmarked = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.query;
    const userId = req.user.id;
    const bookmark = yield bookmark_service_1.BookmarkService.isReportBookmarked(reportId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Bookmark checked successfully",
        data: bookmark,
    });
}));
BookmarkController.deleteBookmark = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { bookmarkId } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const bookmark = yield bookmark_service_1.BookmarkService.deleteBookmarkById(bookmarkId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Bookmark deleted successfully",
        data: bookmark,
    });
}));
