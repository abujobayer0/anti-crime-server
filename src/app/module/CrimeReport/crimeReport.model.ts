import mongoose, { Schema } from "mongoose";
import { ICrimeReport } from "./crimeReport.interface";

const crimeReportSchema = new Schema<ICrimeReport>(
  {
    userId: { type: String, required: true, ref: "User" },
    title: { type: String, required: true },
    crimeType: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    video: { type: String },
    division: { type: String, required: true },
    district: { type: String, required: true },
    postTime: { type: Date, required: true },
    crimeTime: { type: Date, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] },
    ],
    isDeleted: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
    districtCoordinates: { type: [String], default: [] },
    divisionCoordinates: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const CrimeReport = mongoose.model<ICrimeReport>(
  "CrimeReport",
  crimeReportSchema
);
