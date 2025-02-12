/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";

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

// router.post("/reset-link", UserControllers.resetLink);

// router.post("/forget-password", UserControllers.forgetPassword);

// router.post(
//   "/change-password",
//   Auth(USER_ROLE.ADMIN, USER_ROLE.USER),
//   UserControllers.changePassword
// );
export const AuthRoutes = router;
