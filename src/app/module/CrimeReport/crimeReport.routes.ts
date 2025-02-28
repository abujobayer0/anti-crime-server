import express from "express";
import { CrimeReportController } from "./crimeReport.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";
import { cacheMiddleware, clearCache } from "../../middlewares/cache.redis";
const router = express.Router();

router.get("/health", CrimeReportController.getHealth);

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  CrimeReportController.getAllCrimeReports
);

router.get("/query", CrimeReportController.queryCrimeReports);

router.get(
  "/recent-reports",
  Auth(userRole.user, userRole.admin),
  cacheMiddleware({ keyPrefix: "recent-reports", duration: 60 }),
  CrimeReportController.getRecentReports
);

router.get(
  "/user-reports",
  Auth(userRole.user, userRole.admin),
  cacheMiddleware({ keyPrefix: "user-reports" }),
  CrimeReportController.getUserReports
);

router.post(
  "/",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  clearCache("recent-reports"),
  CrimeReportController.createCrimeReport
);

router.post(
  "/analyze",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CrimeReportController.analyzeCrimeReport
);
router.get(
  "/profile-reports/:userId",
  Auth(userRole.user, userRole.admin),
  cacheMiddleware({ keyPrefix: "profile-reports" }),
  CrimeReportController.getProfileReports
);

router.get(
  "/:id",
  Auth(userRole.user, userRole.admin),
  CrimeReportController.getCrimeReportById
);

router.patch(
  "/:id",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CrimeReportController.updateCrimeReport
);
router.delete(
  "/:id",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CrimeReportController.deleteCrimeReport
);

router.post(
  "/:id/upvote",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CrimeReportController.toggleUpvote
);

router.post(
  "/:id/downvote",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CrimeReportController.toggleDownvote
);

export const CrimeReportRoutes = router;
