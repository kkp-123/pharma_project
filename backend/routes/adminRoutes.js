import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getDashboardStats, getDashboardCharts } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard-stats", protect, authorize("admin"), getDashboardStats);
router.get("/dashboard-charts", protect, authorize("admin"), getDashboardCharts);

export default router;