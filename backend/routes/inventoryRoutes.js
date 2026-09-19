import express from "express";
import {
  getInventory,
  getExpiryAlert,
  getLowStock,
  updateInventory,
  deleteInventory,
  getInventoryById,
  adjustStock,
  createDemandFromInventory
} from "../controllers/inventoryController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { checkDepartment } from "../middleware/departmentMiddleware.js";

const router = express.Router();

// View inventory (all logged-in users)
router.get("/", protect, getInventory);
router.get("/expiry", protect, getExpiryAlert);
router.get("/low", protect, getLowStock);
router.get("/:id", protect, getInventoryById);

// Industrial Stock Adjustment (Stock In / Stock Out)
router.post("/adjust", protect, authorize("admin", "manager"), adjustStock);

// Auto-Generate Production Demand from Warehouse
router.post("/create-demand", protect, authorize("admin", "manager"), createDemandFromInventory);

// Update / Delete
router.put("/:id", protect, authorize("admin", "manager"), updateInventory);
router.delete("/:id", protect, authorize("admin", "manager"), deleteInventory);

export default router;