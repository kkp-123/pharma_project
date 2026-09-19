import mongoose from "mongoose";

const productionDemandSchema =
  new mongoose.Schema({

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in-production",
        "completed"
      ],
      default: "pending"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // 🔥 ADD THESE
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" 
    },

    assignedDate: Date,

    startDate: Date,

    completedDate: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }

  }, { timestamps: true });

export default mongoose.model(
  "ProductionDemand",
  productionDemandSchema
);