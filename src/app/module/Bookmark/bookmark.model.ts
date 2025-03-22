import mongoose from "mongoose";
import { IBookmark } from "./bookmark.interface";

const bookmarkSchema = new mongoose.Schema<IBookmark>(
  {
    userId: { type: String, required: true, ref: "User" },
    reportId: { type: String, required: true, ref: "CrimeReport" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Bookmark = mongoose.model<IBookmark>("Bookmarks", bookmarkSchema);
