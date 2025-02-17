/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { userRole } from "./auth.utils";
import Auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/register",
  validateRequest(UserValidation.registerUserValidationSchema),
  AuthController.register
);

router.post(
  "/login",
  validateRequest(UserValidation.loginUserValidationSchema),
  AuthController.login
);
router.get("/me", Auth(userRole.admin, userRole.user), AuthController.getMe);

router.post("/reset-link", AuthController.resetLink);

router.post("/forgot-password", AuthController.forgetPassword);

router.post(
  "/change-password",
  Auth(userRole.admin, userRole.user),
  AuthController.changePassword
);

export const AuthRoutes = router;
