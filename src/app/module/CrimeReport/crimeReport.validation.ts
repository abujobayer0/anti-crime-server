import { z } from "zod";

export const crimeReportValidation = z.object({
  userId: z.string(),
  title: z.string().min(5),
  description: z.string().min(10),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  division: z.string(),
  district: z.string(),
  postTime: z.date(),
  crimeTime: z.date(),
  upvotes: z.array(z.string()).optional(),
  downvotes: z.array(z.string()).optional(),
  comments: z.array(z.string()).optional(),
  isDeleted: z.boolean().default(false),
});
