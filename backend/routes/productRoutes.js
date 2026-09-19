import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// 🟢 Create Product (Admin only)
router.post("/create", protect, authorize("admin"), upload.single("image"), createProduct);
router.post("/add", protect, authorize("admin"), upload.single("image"), createProduct);
router.post("/", protect, authorize("admin"), upload.single("image"), createProduct);

// 🔵 Get all products
router.get("/", protect, getProducts);
router.get("/all", protect, getProducts);

// 🟡 Get single product
router.get("/:id", protect, getProductById);

// 🟠 Update product (Admin)
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateProduct);

// 🔴 Delete product (Admin)
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;