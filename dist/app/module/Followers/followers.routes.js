"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowersRoutes = void 0;
const express_1 = __importDefault(require("express"));
const followers_controller_1 = __importDefault(require("./followers.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_utils_1 = require("../Auth/auth.utils");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), followers_controller_1.default.getFollowers);
router.get("/check-follow-status/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), followers_controller_1.default.checkFollow);
router.post("/follow/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), followers_controller_1.default.followUser);
router.post("/unfollow/:id", (0, auth_1.default)(auth_utils_1.userRole.user, auth_utils_1.userRole.admin), followers_controller_1.default.unfollowUser);
exports.FollowersRoutes = router;
