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
exports.CommentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const comment_service_1 = require("./comment.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
class CommentController {
}
exports.CommentController = CommentController;
_a = CommentController;
CommentController.createComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { reportId } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const comment = yield comment_service_1.CommentService.createComment(reportId, userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment created successfully",
        data: comment,
    });
}));
CommentController.updateComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { commentId } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const comment = yield comment_service_1.CommentService.updateComment(commentId, userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment updated successfully",
        data: comment,
    });
}));
CommentController.deleteComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { commentId } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const comment = yield comment_service_1.CommentService.deleteComment(commentId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment deleted successfully",
        data: comment,
    });
}));
