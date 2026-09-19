import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getEmployeesByDepartment,
  saveFaceData,
  removeFaceData,
  getFaceStatus,
  getFaceDescriptor
} from "../controllers/userController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// User & Face Routes
router.get("/", protect, authorize("admin", "manager"), getUsers);
router.get("/department", protect, authorize("manager", "admin"), getEmployeesByDepartment);

// Face routes
router.post("/:id/face", protect, authorize("admin", "manager"), saveFaceData);
router.delete("/:id/face", protect, authorize("admin", "manager"), removeFaceData);
router.get("/:id/face-status", protect, getFaceStatus);
router.get("/:id/face-descriptor", protect, getFaceDescriptor);

router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);
router.get("/:id", protect, getUserById);

export default router;