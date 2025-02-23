import mongoose, { Document, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: { type: String, required: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isVerified: { type: Boolean, default: false },
    profileImage: {
      type: String,
      default: "https://i.ibb.co.com/39NgCZb8/images-1.png",
    },
    coverImage: {
      type: String,
      default:
        "https://i.ibb.co.com/fzsxJRcd/canva-pink-minimalist-watercolor-background-linkedin-banner-Uub-SLOW3-Y3-M.jpg",
    },
    bio: { type: String, default: "N/A" },
    isBanned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    address: { type: String, required: false },
  },
  { timestamps: true }
);

const User = mongoose.model<TUser>("User", UserSchema);

export default User;
