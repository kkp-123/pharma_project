import express from "express";
import { updateProfile } from "../controllers/updateProfileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile/:id", protect, updateProfile);

export default router;