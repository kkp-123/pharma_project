import express from "express";
import {
  createTask,
  getManagerTasks,
    getEmployeeTasks,
    updateTask,
    updateTaskProgress,
    addComment
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
// CREATE TASK (Manager can assign to employee or department)
router.post("/", protect, authorize("manager"), createTask);

router.get("/manager", protect, authorize("manager"), getManagerTasks);
router.get("/employee", protect, authorize("employee"), getEmployeeTasks);

router.put("/:id", protect, authorize("manager"), updateTask);
router.put("/:id/progress", protect, authorize("employee"), updateTaskProgress);

router.post("/:id/comment", protect, authorize("manager", "employee"), addComment);

export default router;