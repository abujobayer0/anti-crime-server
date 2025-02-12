import httpStatus from "http-status";
import { TUser } from "../Auth/auth.interface";
import User from "../Auth/auth.model";
import AppError from "../../errors/AppError";

export class UserService {
  static async getAllUsers(): Promise<TUser[]> {
    return await User.find({ isDeleted: false }).select("-password");
  }

  static async getUserById(id: string): Promise<TUser | null> {
    const user = await User.findById(id).select("-password");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }
  static async getMeForDB(id: string): Promise<TUser | null> {
    const user = await User.findById(id).select("-password");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }

  static async updateUserById(
    id: string,
    updates: Partial<TUser>
  ): Promise<TUser | null> {
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");
    if (!updatedUser)
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return updatedUser;
  }

  static async deleteUserById(id: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
}
