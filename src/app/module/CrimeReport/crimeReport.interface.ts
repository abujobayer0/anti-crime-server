import { TUser } from "../Auth/auth.interface";
import { Types } from "mongoose";
export interface ICrimeReport {
  userId: Types.ObjectId | TUser;
  title: string;
  description: string;
  images?: string[];
  video?: string;
  division: string;
  district: string;
  postTime: Date;
  crimeTime: Date;
  upvotes: string[];
  downvotes: string[];
  comments: string[];
  isDeleted: boolean;
  updatedAt?: Date;
  districtCoordinates: number[];
  divisionCoordinates: number[];
  createdAt: Date;
}
