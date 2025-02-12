/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ReportsValidation } from "./reports.validation";
import { ReportsController } from "./reports.controller";

const router = express.Router();

router.post(
  "/create",
  validateRequest(ReportsValidation.createReportsValidation),
  ReportsController.create
);

export const ReportsRoutes = router;
