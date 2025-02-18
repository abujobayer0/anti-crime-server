import express from "express";
import { CrimeReportController } from "./crimeReport.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";

const router = express.Router();

router.post(
  "/",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.createCrimeReport
);

router.post(
  "/analyze",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.analyzeCrimeReport
);

router.post(
  "/analyze",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.analyzeCrimeReport
);

router.get(
  "/",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.getAllCrimeReports
);
router.get(
  "/q",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.queryCrimeReports
);

router.get(
  "/:id",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.getCrimeReportById
);
router.patch(
  "/:id",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.updateCrimeReport
);
router.delete(
  "/:id",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.deleteCrimeReport
);

router.post(
  "/:id/upvote",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.toggleUpvote
);

router.post(
  "/:id/downvote",
  Auth(userRole.admin, userRole.user),
  CrimeReportController.toggleDownvote
);

export const CrimeReportRoutes = router;
