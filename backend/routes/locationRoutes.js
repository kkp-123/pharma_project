import express from "express";

import {
  getLocation,
  getAllLocations,
  setLocation,
  updateLocation,
  deactivateLocation,
  activateLocation
} from "../controllers/locationController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();


// PUBLIC / EMPLOYEE
router.get("/", protect, getLocation);


// ADMIN ONLY
router.get("/all", protect, authorize("admin"), getAllLocations);

router.post("/", protect, authorize("admin"), setLocation);

router.put("/:id", protect, authorize("admin"), updateLocation);

router.patch("/deactivate/:id", protect, authorize("admin"), deactivateLocation);

router.patch("/activate/:id", protect, authorize("admin"), activateLocation);


export default router;