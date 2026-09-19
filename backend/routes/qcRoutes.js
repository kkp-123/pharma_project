import express from "express";
import { checkBatch,getAllQC,getSingleQC } from "../controllers/qcController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { checkDepartment } from "../middleware/departmentMiddleware.js";

const router = express.Router();

// QC Check (Only QC Manager)
router.post(
  "/check",
  protect,
  authorize("manager"),
  checkDepartment("QC"),
  checkBatch
);
router.get("/", getAllQC);
router.get("/:id", getSingleQC);

export default router;