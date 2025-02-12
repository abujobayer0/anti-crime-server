import { z } from "zod";
const UpvoteDownvoteSchema = z.object({
  user: z.string().min(1), // Assuming user is stored as a string (userId)
});

const createReportsValidation = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  division: z.string(),
  district: z.string(),
  postTime: z.date(),
  crimeTime: z.date(),
  upvotes: z.array(UpvoteDownvoteSchema).default([]),
  downvotes: z.array(UpvoteDownvoteSchema).default([]),
  comments: z.array(z.string()),
  updatedAt: z.date(),
  isDeleted: z.boolean().default(false),
});

export const ReportsValidation = {
  createReportsValidation,
};
