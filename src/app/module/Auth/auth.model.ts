import mongoose, { Document, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contract: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isVerified: { type: Boolean, default: false },
    profileImage: {
      type: String,
      default:
        "https://st4.depositphotos.com/9998432/22670/v/450/depositphotos_226700620-stock-illustration-person-gray-photo-placeholder-woman.jpg",
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
