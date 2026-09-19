import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import ProductionDemand from "../models/ProductionDemand.js";
import Batch from "../models/Batch.js";
import { logAudit } from "../utils/auditLogger.js";

//
// GET ALL INVENTORY
//
export const getInventory = async (req, res) => {
  try {
    const data = await Inventory.find()
      .populate("product", "name type price description")
      .populate("batch", "batchNumber status manufactureDate expiryDate quantity")
      .populate("createdBy", "name email")
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: data.length,
      inventories: data
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// GET SINGLE INVENTORY BY ID
//
export const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate("product")
      .populate("batch");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found"
      });
    }

    res.status(200).json({
      success: true,
      inventory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//
// UPDATE INVENTORY
//
export const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      inventory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//
// DELETE INVENTORY
//
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory record deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//
// EXPIRY ALERT (Next 30/60 Days)
//
export const getExpiryAlert = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const data = await Inventory.find({
      expiryDate: { $lte: targetDate }
    })
      .populate("product", "name type price")
      .populate("batch", "batchNumber expiryDate manufactureDate")
      .sort({ expiryDate: 1 });

    res.json(data);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// LOW STOCK (Product Level)
//
export const getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 1000;

    const data = await Inventory.aggregate([
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          batchCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $match: {
          totalQuantity: { $lte: threshold }
        }
      },
      {
        $project: {
          _id: "$product._id",
          productName: "$product.name",
          productType: "$product.type",
          price: "$product.price",
          totalQuantity: 1,
          batchCount: 1,
          minStock: { $ifNull: ["$product.minStock", 1000] }
        }
      }
    ]);

    res.json(data);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// STOCK ADJUSTMENT (Stock In / Stock Out / Damaged Write-off)
//
export const adjustStock = async (req, res) => {
  try {
    const { inventoryId, type, quantity, reason } = req.body;

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Inventory ID and positive quantity are required"
      });
    }

    const inventory = await Inventory.findById(inventoryId).populate("product batch");
    if (!inventory) {
      return res.status(404).json({ success: false, message: "Inventory record not found" });
    }

    const previousQty = inventory.quantity;
    const change = Number(quantity);

    if (type === "out" || type === "write_off") {
      if (inventory.quantity < change) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Current available: ${inventory.quantity} units`
        });
      }
      inventory.quantity -= change;
    } else {
      inventory.quantity += change;
    }

    await inventory.save();

    await logAudit(req, {
      action: "STOCK_ADJUSTMENT",
      entity: "Inventory",
      entityId: inventory._id,
      details: {
        product: inventory.product?.name,
        batch: inventory.batch?.batchNumber,
        type,
        adjustedQuantity: change,
        previousQuantity: previousQty,
        newQuantity: inventory.quantity,
        reason: reason || "Manual warehouse adjustment"
      }
    });

    res.json({
      success: true,
      message: `Stock ${type === "out" ? "deducted" : "added"} successfully. New balance: ${inventory.quantity} units`,
      inventory
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// CREATE PRODUCTION DEMAND FROM LOW STOCK (With duplicate demand check)
//
export const createDemandFromInventory = async (req, res) => {
  try {
    const { productId, quantity, notes, force } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product and valid demand quantity are required"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if an active demand already exists for this product
    const existingDemand = await ProductionDemand.findOne({
      product: productId,
      status: { $in: ["pending", "assigned", "in-production"] }
    });

    if (existingDemand && !force) {
      return res.status(200).json({
        success: false,
        requiresConfirmation: true,
        existingDemand: {
          _id: existingDemand._id,
          quantity: existingDemand.quantity,
          status: existingDemand.status,
          createdAt: existingDemand.createdAt
        },
        message: `An active production demand for "${product.name}" already exists (${existingDemand.quantity.toLocaleString()} units, status: "${existingDemand.status}"). Do you want to create another separate request anyway?`
      });
    }

    const demand = await ProductionDemand.create({
      product: productId,
      quantity: Number(quantity),
      status: "pending",
      startDate: new Date(),
      assignedBy: req.user._id,
      createdBy: req.user._id
    });

    await logAudit(req, {
      action: "PRODUCTION_DEMAND_GENERATED",
      entity: "ProductionDemand",
      entityId: demand._id,
      details: {
        productName: product.name,
        quantity,
        origin: "Warehouse Low Stock Auto-Reorder",
        notes
      }
    });

    res.status(201).json({
      success: true,
      message: `Production Demand for ${quantity.toLocaleString()} units of ${product.name} created successfully!`,
      demand
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};