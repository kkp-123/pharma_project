import express from "express";
import {
  applyLeave,
  updateLeaveStatus,
  getMyLeaves,
  getManagerLeaves
} from "../controllers/leaveController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Employee & Manager Apply & View
router.post("/apply", protect, applyLeave);
router.get("/my", protect, getMyLeaves);
router.get("/", protect, getMyLeaves);

// Manager & Admin Review
router.get("/manager", protect, authorize("manager", "admin"), getManagerLeaves);
router.get("/all", protect, authorize("manager", "admin"), getManagerLeaves);

// Approve / Reject Leave
router.put("/status/:id", protect, authorize("manager", "admin"), updateLeaveStatus);
router.put("/:id", protect, authorize("manager", "admin"), updateLeaveStatus);

export default router;