import express from "express";
import {
  generateAllSalaries,
  generateSalary,
  previewSalaryCalculation,
  getAllSalaries,
  getMySalary,
  getSalaryStatusByMonth,
  markSalaryPaid,
  bulkMarkSalariesPaid
} from "../controllers/salaryController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Preview & Generate Corporate Salary (Admin & HR Manager)
router.post("/preview", protect, authorize("admin", "manager"), previewSalaryCalculation);
router.post("/generate", protect, authorize("admin", "manager"), generateSalary);
router.post("/generate-all", protect, authorize("admin", "manager"), generateAllSalaries);

// View Personal Salary (All Employees & Managers)
router.get("/my", protect, getMySalary);

// Admin / HR view all payroll summaries
router.get("/all", protect, authorize("admin", "manager"), getAllSalaries);
router.get("/status", protect, authorize("admin", "manager"), getSalaryStatusByMonth);

// Mark Paid (Single & Bulk)
router.put("/pay/:id", protect, authorize("admin", "manager"), markSalaryPaid);
router.post("/bulk-pay", protect, authorize("admin", "manager"), bulkMarkSalariesPaid);

export default router;