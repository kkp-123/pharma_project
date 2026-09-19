import express from "express";

import {
  getProductionDemands,
  createProductionDemand,
  getSingleDemand,
  assignProduction,
  startProduction,
  completeProduction,
  deleteDemand,
  getMyProduction
} from "../controllers/productionDemandController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getProductionDemands);
router.post("/", protect, createProductionDemand);

router.get('/my',protect,getMyProduction);

router.get("/:id", protect, getSingleDemand);

router.put("/assign/:id", protect, assignProduction);

router.put("/start/:id", protect, startProduction);

router.put("/complete/:id", protect, completeProduction);

router.delete("/:id", protect, deleteDemand);

export default router;