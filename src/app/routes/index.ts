import { Router } from "express";
import { AuthRoutes } from "../module/Auth/auth.routes";
import { UserRoutes } from "../module/User/user.routes";
import { CrimeReportRoutes } from "../module/CrimeReport/crimeReport.routes";
import { CommentRoutes } from "../module/Comment/comment.routes";
import { NotificationRoutes } from "../module/Notification/notification.routes";
import { FollowersRoutes } from "../module/Followers/followers.routes";
const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/reports",
    route: CrimeReportRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/comments",
    route: CommentRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/followers",
    route: FollowersRoutes,
  },
];

// This will automatically loop your routes that you will add in the moduleRoutes array
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
