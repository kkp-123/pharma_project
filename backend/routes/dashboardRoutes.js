import express from "express";
import {
  getDashboardStats,
  getDashboardCharts,
  getManagerSummary,
  getEmployeeSummary
} from "../controllers/dashboardController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin & Global Stats
router.get("/dashboard-stats", protect, authorize("admin", "manager"), getDashboardStats);
router.get("/dashboard-charts", protect, authorize("admin", "manager"), getDashboardCharts);
router.get("/admin/summary", protect, authorize("admin"), getDashboardStats);
router.get("/admin/charts", protect, authorize("admin"), getDashboardCharts);

// Manager Department Summary
router.get("/manager/summary", protect, authorize("manager", "admin"), getManagerSummary);

// Employee Personal Summary
router.get("/employee/summary", protect, getEmployeeSummary);

export default router;