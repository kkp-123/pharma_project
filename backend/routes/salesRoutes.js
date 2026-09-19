import express from "express";

import {
  createSale,
  getSales,
  getSingleSale,
  updateSaleStatus,
  deleteSale,
  salesDashboard,
  addPayment,
  allocateSaleOrder
} from "../controllers/salesController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🛒 Sales Routes
router.post("/", protect, authorize("manager", "admin", "employee"), createSale);
router.get("/", protect, authorize("manager", "admin", "employee"), getSales);
router.get("/dashboard", protect, authorize("admin", "manager"), salesDashboard);
router.get("/:id", protect, authorize("manager", "admin", "employee"), getSingleSale);
router.put("/:id", protect, authorize("manager", "admin"), updateSaleStatus);
router.delete("/:id", protect, authorize("manager", "admin"), deleteSale);

// 📦 Allocate Stock / Demand Trigger for Order
router.post("/:id/allocate", protect, authorize("manager", "admin", "employee"), allocateSaleOrder);

// 💳 Add Payment
router.post("/:id/payment", protect, authorize("manager", "admin", "employee"), addPayment);

export default router;