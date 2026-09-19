import ProductionDemand from "../models/ProductionDemand.js";
import Batch from "../models/Batch.js";
import Product from "../models/Product.js";
import { createNotification } from "./notificationController.js";

// CREATE DIRECT PRODUCTION DEMAND (With per-product & per-company duplicate checks)
export const createProductionDemand = async (req, res) => {
  try {
    const { product, quantity, companyName, force } = req.body;

    if (!product || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product formulation and positive quantity are required"
      });
    }

    const prod = await Product.findById(product);
    if (!prod) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const compName = (companyName || "Internal Warehouse").trim();

    // Check if an active demand ALREADY exists for this PARTICULAR PRODUCT and THIS SAME COMPANY
    const existingDemand = await ProductionDemand.findOne({
      product,
      companyName: { $regex: new RegExp(`^${compName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
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
          companyName: existingDemand.companyName
        },
        message: `An active production demand for "${prod.name}" already exists for "${compName}" (${existingDemand.quantity.toLocaleString()} units, status: "${existingDemand.status}"). Do you want to create an additional separate request anyway?`
      });
    }

    const demand = await ProductionDemand.create({
      product,
      quantity: Number(quantity),
      companyName: compName,
      status: "pending",
      startDate: new Date(),
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Production Demand for ${Number(quantity).toLocaleString()} units of ${prod.name} (${compName}) created successfully!`,
      demand
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//GET ALL DEMANDS
export const getProductionDemands = async (req, res) => {
  try {
    const demands = await ProductionDemand.find()
      .populate("product", "name type price")
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      demands
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//GET SINGLE DEMAND

export const getSingleDemand = async (req, res) => {
  try {

    const demand =
      await ProductionDemand.findById(
        req.params.id
      )
        .populate("product", "name")
        .populate("assignedTo", "name");

    res.json(demand);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//ASSIGN EMPLOYEE

export const assignProduction = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const demand = await ProductionDemand.findById(req.params.id);

    if (!demand) {
      return res.status(404).json({ message: "Demand not found" });
    }

    demand.assignedTo = employeeId;
    demand.assignedBy = req.user._id;
    demand.assignedDate = new Date();
    demand.status = "assigned";

    await demand.save();

    //NOTIFY EMPLOYEE
    await createNotification(
      employeeId,
      `New production task assigned: ${demand.product}`,
      "production"
    );

    res.json({
      success: true,
      demand
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//START PRODUCTION

export const startProduction = async (req, res) => {

  try {

    const demand =
      await ProductionDemand.findById(
        req.params.id
      );

    if (!demand) {
      return res.status(404).json({
        message: "Demand not found"
      });
    }

    demand.status = "in-production";
    demand.startDate = new Date();

    await demand.save();

    res.json({
      success: true,
      demand
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//COMPLETE PRODUCTION (Creates Batch sent to QC)
export const completeProduction = async (req, res) => {
  try {
    const demand = await ProductionDemand.findById(req.params.id).populate("product");

    if (!demand) {
      return res.status(404).json({
        message: "Demand not found"
      });
    }

    demand.status = "completed";
    demand.completedDate = new Date();
    await demand.save();

    // Check if batch already created for this demand
    let batch = await Batch.findOne({ productionDemand: demand._id });
    if (!batch) {
      const batchNumber = "BATCH-" + Date.now();
      batch = await Batch.create({
        product: demand.product?._id || demand.product,
        quantity: demand.quantity,
        manufactureDate: demand.startDate || new Date(),
        expiryDate: new Date(Date.now() + 730 * 86400000),
        productionDemand: demand._id,
        batchNumber,
        status: "pending",
        createdBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: `Production synthesis completed! Batch ${batch.batchNumber} generated and dispatched to QC Laboratory for chemical inspection.`,
      demand,
      batch
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//DELETE DEMAND (Optional)

export const deleteDemand = async (req, res) => {
  try {

    await ProductionDemand.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Demand deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const getMyProduction = async (req,res)=>{

const demands = await ProductionDemand.find({
assignedTo: req.user._id
})
.populate("product", "name")
.sort({ createdAt:-1 });

res.json(demands);

}