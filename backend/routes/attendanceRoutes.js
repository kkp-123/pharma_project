import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyTodayStatus,
  getAllAttendance,
  getAttendanceDashboard,
  getAttendanceReport,
  overrideAttendance,
  createManualAttendance
} from "../controllers/attendanceController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📍 Check-in / Check-out (Protected for all logged in employees/managers/admins)
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);

// ✍️ Manual Attendance Entry (HR Manager & Admin)
router.post("/manual", protect, authorize("admin", "manager"), createManualAttendance);

// 👤 View own attendance & today's status
router.get("/my", protect, getMyAttendance);
router.get("/today-status", protect, getMyTodayStatus);

// 📊 Attendance dashboard summary
router.get(
  "/dashboard",
  protect,
  authorize("admin", "manager"),
  getAttendanceDashboard
);

// 📋 All Attendance list
router.get(
  "/all",
  protect,
  authorize("admin", "manager"),
  getAllAttendance
);

// 📄 Filtered & Paginated Attendance Report
router.get(
  "/report",
  protect,
  authorize("admin", "manager"),
  getAttendanceReport
);

// ✏️ Manual Attendance Override (Admin or HR Manager only)
router.put(
  "/:id/override",
  protect,
  authorize("admin", "manager"),
  overrideAttendance
);

export default router;