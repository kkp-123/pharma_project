import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },

  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true,
    unique: true // one batch = one inventory entry
  },

  quantity: {
    type: Number,
    required: true,
    min: 0
  },

  // Optional (better move to Product model)
  minStock: {
    type: Number,
    default: 100
  },

  // FIXED: use Date instead of String
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },

  manufactureDate: {
    type: Date,
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

//
// VALIDATION: expiry must be after manufacture
//
inventorySchema.pre("save", function () {
  if (this.expiryDate <= this.manufactureDate) {
    throw new Error("Expiry must be after manufacture date");
  }
});

export default mongoose.model("Inventory", inventorySchema);