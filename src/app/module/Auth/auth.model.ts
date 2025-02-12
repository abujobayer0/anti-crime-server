import mongoose, { Document, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contract: { type: Number, required: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "N/A" },
    isBanned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    address: { type: String, required: false },
  },
  { timestamps: true }
);

const User = mongoose.model<TUser>("User", UserSchema);

export default User;
