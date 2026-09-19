import express from "express";
import { registerUser, loginUser, getManagers } from "../controllers/authController.js"; 
import { protect, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();


router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});
router.post("/create-user",protect,authorize("admin"), registerUser);
// router.post("/register",registerUser);

router.post("/login", loginUser);

router.get("/getManagers",protect,authorize("admin"),getManagers);

export default router;