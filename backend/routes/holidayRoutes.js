import express from "express";
import {
  addHoliday,
  getHolidays,
  deleteHoliday
} from "../controllers/holidayController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { checkDepartment } from "../middleware/departmentMiddleware.js";

const router = express.Router();

// Admin & HR Manager can manage holidays
router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  checkDepartment("HR"),
  addHoliday
);

router.get("/", protect, getHolidays);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  checkDepartment("HR"),
  deleteHoliday
);

export default router;