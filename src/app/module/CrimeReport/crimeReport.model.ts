import mongoose from "mongoose";
import { ICrimeReport } from "./crimeReport.interface";

const crimeReportSchema = new mongoose.Schema<ICrimeReport>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    video: { type: String },
    division: { type: String, required: true },
    district: { type: String, required: true },
    postTime: { type: Date, required: true },
    crimeTime: { type: Date, required: true },
    upvotes: [{ type: String, default: [] }],
    downvotes: [{ type: String, default: [] }],
    comments: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] },
    ],
    isDeleted: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CrimeReport = mongoose.model<ICrimeReport>(
  "CrimeReport",
  crimeReportSchema
);
