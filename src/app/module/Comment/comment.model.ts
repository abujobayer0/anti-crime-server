import mongoose from "mongoose";
import { IComment } from "./comment.interface";

const commentSchema = new mongoose.Schema<IComment>(
  {
    userId: { type: String, required: true, ref: "User" },
    comment: { type: String, required: true },
    reportId: { type: String, required: true, ref: "CrimeReport" },
    proofImage: [{ type: String }],
    proofVideo: [{ type: String }],
    replyTo: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment = mongoose.model<IComment>("Comment", commentSchema);
