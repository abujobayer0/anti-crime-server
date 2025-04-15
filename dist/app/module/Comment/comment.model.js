"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, ref: "User" },
    comment: { type: String, required: true, default: "" },
    reportId: { type: String, required: true, ref: "CrimeReport" },
    proofImage: [{ type: String }],
    proofVideo: [{ type: String }],
    replyTo: [
        { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Comment", default: [] },
    ],
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Comment = mongoose_1.default.model("Comment", commentSchema);
