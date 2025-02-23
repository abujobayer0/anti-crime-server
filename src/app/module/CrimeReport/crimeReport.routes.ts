import express from "express";
import { CrimeReportController } from "./crimeReport.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";
import { cacheMiddleware, clearCache } from "../../middlewares/cache.redis";
const router = express.Router();

router.post(
  "/",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.createCrimeReport
);

router.post(
  "/analyze",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.analyzeCrimeReport
);

router.get(
  "/",
  Auth(userRole.admin, userRole.user),
  cacheMiddleware({ keyPrefix: "crime-reports", duration: 300 }),
  CrimeReportController.getAllCrimeReports
);

router.get("/query", CrimeReportController.queryCrimeReports);

router.get(
  "/recent-reports",
  Auth(userRole.admin, userRole.user),
  cacheMiddleware({ keyPrefix: "recent-reports", duration: 60 }),
  CrimeReportController.getRecentReports
);

router.get(
  "/user-reports",
  Auth(userRole.admin, userRole.user),
  cacheMiddleware({ keyPrefix: "user-reports", duration: 300 }),
  CrimeReportController.getUserReports
);
router.get(
  "/profile-reports/:userId",
  Auth(userRole.admin, userRole.user),
  cacheMiddleware({ keyPrefix: "profile-reports", duration: 300 }),
  CrimeReportController.getProfileReports
);

router.get(
  "/:id",
  Auth(userRole.admin, userRole.user),
  cacheMiddleware({ keyPrefix: "crime-report", duration: 300 }),
  CrimeReportController.getCrimeReportById
);

router.patch(
  "/:id",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.updateCrimeReport
);
router.delete(
  "/:id",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.deleteCrimeReport
);

router.post(
  "/:id/upvote",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.toggleUpvote
);

router.post(
  "/:id/downvote",
  Auth(userRole.admin, userRole.user),
  clearCache("crime-reports"),
  CrimeReportController.toggleDownvote
);

export const CrimeReportRoutes = router;
