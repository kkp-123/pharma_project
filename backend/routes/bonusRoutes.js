import express from "express";
import { addBonus,getAllBonus,markBonusPaid,getMyBonus } from "../controllers/bonusController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only admin can give bonus
router.post("/", protect, authorize("admin"), addBonus);

router.get("/", protect, authorize("admin"), getAllBonus);

// Employee
router.get("/my", protect, getMyBonus);

// Mark Paid
router.put("/:id/pay", protect, authorize("admin"), markBonusPaid);



export default router;   