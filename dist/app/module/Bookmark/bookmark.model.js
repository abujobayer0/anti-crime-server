"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bookmark = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bookmarkSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, ref: "User" },
    reportId: { type: String, required: true, ref: "CrimeReport" },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Bookmark = mongoose_1.default.model("Bookmarks", bookmarkSchema);
