import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  // 🔥 Link with production demand
  productionDemand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductionDemand"
  },

  batchNumber: {
    type: String,
    unique: true,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  manufactureDate: {
    type: Date,
    required: true
  },

  expiryDate: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);