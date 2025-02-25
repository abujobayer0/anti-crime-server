import express from "express";
import { UserController } from "./user.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";

const router = express.Router();

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  UserController.getAllUsers
);

router.get(
  "/get-me",
  Auth(userRole.user, userRole.admin),
  UserController.getMe
);

router.get(
  "/:id",
  Auth(userRole.user, userRole.admin),
  UserController.getUserById
);

router.patch(
  "/:id",
  Auth(userRole.user, userRole.admin),
  UserController.updateUserById
);

router.delete(
  "/:id",
  Auth(userRole.user, userRole.admin),
  UserController.deleteUserById
);

export const UserRoutes = router;
