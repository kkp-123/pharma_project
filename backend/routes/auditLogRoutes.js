import express from "express";
import { getAuditLogs } from "../controllers/auditLogController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only
router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

export default router;

