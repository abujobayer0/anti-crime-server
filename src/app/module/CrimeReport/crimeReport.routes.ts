import express from "express";
import { CrimeReportController } from "./crimeReport.controller";
import Auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.utils";

const router = express.Router();

router.post(
  "/",
  // Auth(userRole.admin, userRole.user),
  CrimeReportController.createCrimeReport
);
router.get(
  "/",
  // Auth(userRole.admin, userRole.user),
  CrimeReportController.getAllCrimeReports
);
router.get(
  "/:id",
  // Auth(userRole.admin, userRole.user),
  CrimeReportController.getCrimeReportById
);
router.patch(
  "/:id",
  // Auth(userRole.admin, userRole.user),
  CrimeReportController.updateCrimeReport
);
router.delete(
  "/:id",
  // Auth(userRole.admin, userRole.user),
  CrimeReportController.deleteCrimeReport
);

export const CrimeReportRoutes = router;
