import express from "express";
import FollowersController from "./followers.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";
const router = express.Router();

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  FollowersController.getFollowers
);
router.get(
  "/check-follow-status/:id",
  Auth(userRole.user, userRole.admin),
  FollowersController.checkFollow
);
router.post(
  "/follow/:id",
  Auth(userRole.user, userRole.admin),
  FollowersController.followUser
);
router.post(
  "/unfollow/:id",
  Auth(userRole.user, userRole.admin),
  FollowersController.unfollowUser
);

export const FollowersRoutes = router;
