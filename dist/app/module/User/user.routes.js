"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_utils_1 = require("../Auth/auth.utils");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.getAllUsers);
router.get("/get-banned-users", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.getBannedUsers);
router.get("/get-me", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.getMe);
router.get("/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.getUserById);
router.patch("/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.updateUserById);
router.delete("/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), user_controller_1.UserController.deleteUserById);
exports.UserRoutes = router;
