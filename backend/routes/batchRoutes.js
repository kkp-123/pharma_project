import express from "express";
import {
  createBatch,
  getBatches,
  updateBatchStatus
} from "../controllers/batchController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Batch (Production Manager & Admin)
router.post(
  "/createBatch",
  protect,
  authorize("manager", "admin"),
  createBatch
);
router.post(
  "/add",
  protect,
  authorize("manager", "admin"),
  createBatch
);
router.post(
  "/create",
  protect,
  authorize("manager", "admin"),
  createBatch
);

// Get all batches
router.get("/getBatch", protect, getBatches);
router.get("/all", protect, getBatches);
router.get("/", protect, getBatches);

// Update Batch Status
router.put("/:id/status", protect, authorize("manager", "admin"), updateBatchStatus);

export default router;