import { Router } from "express";
import * as dashboardController from "../admin-dashboard/dashboard.controller";

const router = Router();

router.get("/dashboard", dashboardController.getStats);

export default router;
