"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("../module/Auth/auth.routes");
const user_routes_1 = require("../module/User/user.routes");
const crimeReport_routes_1 = require("../module/CrimeReport/crimeReport.routes");
const comment_routes_1 = require("../module/Comment/comment.routes");
const notification_routes_1 = require("../module/Notification/notification.routes");
const followers_routes_1 = require("../module/Followers/followers.routes");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: "/reports",
        route: crimeReport_routes_1.CrimeReportRoutes,
    },
    {
        path: "/users",
        route: user_routes_1.UserRoutes,
    },
    {
        path: "/comments",
        route: comment_routes_1.CommentRoutes,
    },
    {
        path: "/notifications",
        route: notification_routes_1.NotificationRoutes,
    },
    {
        path: "/followers",
        route: followers_routes_1.FollowersRoutes,
    },
];
// This will automatically loop your routes that you will add in the moduleRoutes array
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
