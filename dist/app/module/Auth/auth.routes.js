"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const auth_utils_1 = require("./auth.utils");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.post("/register", (0, validateRequest_1.default)(auth_validation_1.UserValidation.registerUserValidationSchema), auth_controller_1.AuthController.register);
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.UserValidation.loginUserValidationSchema), auth_controller_1.AuthController.login);
router.post("/reset-link", auth_controller_1.AuthController.resetLink);
router.post("/forgot-password", auth_controller_1.AuthController.forgetPassword);
router.post("/change-password", (0, auth_1.default)(auth_utils_1.userRole.admin, auth_utils_1.userRole.user), auth_controller_1.AuthController.changePassword);
exports.AuthRoutes = router;
