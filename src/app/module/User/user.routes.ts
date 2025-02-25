import express from "express";
import { UserController } from "./user.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";

const router = express.Router();

router.get("/", Auth(userRole.admin), UserController.getAllUsers);

router.get("/get-me", Auth(userRole.admin), UserController.getMe);

router.get(
  "/:id",
  Auth(userRole.admin, userRole.user),
  UserController.getUserById
);

router.patch(
  "/:id",
  Auth(userRole.admin, userRole.user),
  UserController.updateUserById
);

router.delete(
  "/:id",
  Auth(userRole.admin, userRole.user),
  UserController.deleteUserById
);

export const UserRoutes = router;
