import Batch from "../models/Batch.js";
import ProductionDemand from "../models/ProductionDemand.js";

// CREATE BATCH (Production manager)
export const createBatch = async (req, res) => {
  try {

    const {
      product,
      quantity,
      manufactureDate,
      expiryDate,
      productionDemand
    } = req.body;

    const batchNumber = "BATCH-" + Date.now();

    const batch = await Batch.create({
      product,
      quantity,
      manufactureDate: new Date(manufactureDate),
      expiryDate: new Date(expiryDate),
      productionDemand: productionDemand || null,
      batchNumber,
      createdBy: req.user._id
    });

    // Update Production Demand
    if (productionDemand) {

      const demand = await ProductionDemand.findById(productionDemand);

      if (demand) {

        demand.quantity -= quantity;

        if (demand.quantity <= 0) {
          demand.status = "completed";
        }

        await demand.save();
      }
    }

    res.status(201).json(batch);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET ALL BATCHES

export const getBatches = async (req, res) => {
  try {

    const data = await Batch.find()
      .populate("product", "name")
      .populate("createdBy", "name")
      .populate("productionDemand");

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE BATCH STATUS

export const updateBatchStatus = async (req, res) => {
  try {

    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        message: "Not found"
      });
    }

    batch.status = req.body.status;

    await batch.save();

    res.json(batch);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};