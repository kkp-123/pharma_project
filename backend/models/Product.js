import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  type: {   
    type: String,
    enum: ["Tablet", "Capsule", "Syrup", "Injection", "Ointment"],
    required: true
  },

  price: Number,
  description: String,

  image: {
    type: String,
    default: ""
  }

}, { timestamps: true });

export default mongoose.model("Product", productSchema);