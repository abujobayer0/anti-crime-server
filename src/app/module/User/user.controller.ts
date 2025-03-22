import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    const users = await UserService.getAllUsers();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  }

  static async getBannedUsers(req: Request, res: Response) {
    const users = await UserService.getBannedUsers();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Banned users fetched successfully",
      data: users,
    });
  }

  static async getMe(req: Request, res: Response) {
    const users = await UserService.getMeForDB(req.user.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  }

  static async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  }

  static async updateUserById(req: Request, res: Response) {
    const { id } = req.params;

    const updatedUser = await UserService.updateUserById(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  }
  static async deleteUserById(req: Request, res: Response) {
    const { id } = req.params;
    await UserService.deleteUserById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User deleted successfully",
    });
  }
}
