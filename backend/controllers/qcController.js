import mongoose from "mongoose";
import QC from "../models/QC.js";
import Batch from "../models/Batch.js";
import Inventory from "../models/Inventory.js";
import Sale from "../models/Sales.js";


// Get All QC Records
export const getAllQC = async (req, res) => {
  try {

    const qc = await QC.find()
      .populate("batch")
      .populate("checkedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: qc.length,
      data: qc
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// Get Single QC
export const getSingleQC = async (req, res) => {
  try {

    const qc = await QC.findById(req.params.id)
      .populate("batch")
      .populate("checkedBy", "name email");

    res.status(200).json({
      success: true,
      data: qc
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const checkBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { batchId, result, remarks } = req.body;

    // Validate result
    if (!["pass", "fail"].includes(result)) {
      return res.status(400).json({
        message: "Result must be pass or fail"
      });
    }

    // Find batch
    const batch = await Batch.findById(batchId)
      .populate("product")
      .session(session);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    // Already QC done
    if (batch.status !== "pending") {
      return res.status(400).json({
        message: "QC already completed"
      });
    }

    // Check if QC already exists
    const existingQC = await QC.findOne({
      batch: batch._id
    }).session(session);

    if (existingQC) {
      return res.status(400).json({
        message: "QC already done"
      });
    }

    // Save QC
    const qc = await QC.create([{
      batch: batch._id,
      result,
      remarks,
      checkedBy: req.user._id
    }], { session });

    // Update batch
    batch.status = result === "pass" ? "approved" : "rejected";
    await batch.save({ session });

    // Create inventory if pass
    if (result === "pass") {

      const exists = await Inventory.findOne({
        batch: batch._id
      }).session(session);

      if (!exists) {
        const inventory = await Inventory.create([{
          product: batch.product._id,
          batch: batch._id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          manufactureDate: batch.manufactureDate,
          createdBy: batch.createdBy
        }], { session });

        //Allocate Stock Automatically
        await allocateStock(batch.product._id, session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `QC ${result} successful`,
      qc: qc[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

export const allocateStock = async (productId, session) => {
  const salesQuery = Sale.find({
    status: { $in: ["production-required", "partial", "pending"] },
    "items.product": productId
  }).sort({ createdAt: 1 });

  if (session) salesQuery.session(session);
  const sales = await salesQuery;

  for (const sale of sales) {
    let updated = false;

    for (const item of sale.items) {
      if (
        item.product.toString() !==
        productId.toString()
      ) continue;

      let remaining = item.remainingQuantity;
      if (remaining <= 0) continue;

      const today = new Date();

      const invQuery = Inventory.find({
        product: productId,
        quantity: { $gt: 0 },
        expiryDate: { $gt: today }
      })
        .populate("batch")
        .sort({ expiryDate: 1 });

      if (session) invQuery.session(session);
      const inventory = await invQuery;

      for (const stock of inventory) {
        if (remaining <= 0) break;

        const deduct = Math.min(
          remaining,
          stock.quantity
        );

        stock.quantity -= deduct;
        remaining -= deduct;

        item.allocatedQuantity = (item.allocatedQuantity || 0) + deduct;

        // batch tracking
        item.batchAllocations.push({
          batch: stock.batch?._id || stock.batch,
          quantity: deduct
        });

        if (session) {
          await stock.save({ session });
        } else {
          await stock.save();
        }
        updated = true;
      }

      item.remainingQuantity = remaining;
    }

    const stillPending =
      sale.items.some(
        i => (i.remainingQuantity || 0) > 0
      );
    const someAllocated =
      sale.items.some(
        i => (i.allocatedQuantity || 0) > 0
      );

    sale.status = !stillPending
      ? "approved"
      : someAllocated
      ? "partial"
      : "production-required";

    if (updated) {
      if (session) {
        await sale.save({ session });
      } else {
        await sale.save();
      }
    }
  }
};