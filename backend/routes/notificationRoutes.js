import express from "express";
import {
  getMyNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);
router.delete("/", protect, clearAllNotifications);

export default router;