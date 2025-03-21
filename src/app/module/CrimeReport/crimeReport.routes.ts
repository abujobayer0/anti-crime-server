import express from "express";
import { CrimeReportController } from "./crimeReport.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";

const router = express.Router();

router.get("/health", CrimeReportController.getHealth);

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  CrimeReportController.getAllCrimeReports
);

router.get(
  "/algorithmic-reports",
  Auth(userRole.user, userRole.admin),
  CrimeReportController.getAllAlgorithmicReports
);

router.get("/query", CrimeReportController.queryCrimeReports);

router.get(
  "/recent-reports",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.getRecentReports
);

router.get(
  "/user-reports",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.getUserReports
);

router.post(
  "/",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.createCrimeReport
);

router.get(
  "/profile-reports/:userId",
  Auth(userRole.user, userRole.admin),

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

  CrimeReportController.updateCrimeReport
);
router.delete(
  "/:id",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.deleteCrimeReport
);

router.post(
  "/:id/upvote",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.toggleUpvote
);

router.post(
  "/:id/downvote",
  Auth(userRole.user, userRole.admin),

  CrimeReportController.toggleDownvote
);

export const CrimeReportRoutes = router;
