import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({

  name: {
    type: String,
    default: "Office Location"
  },

  latitude: {
    type: Number,
    required: true
  },

  longitude: {
    type: Number,
    required: true
  },

  radius: {
    type: Number, // meters
    default: 100
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("Location", locationSchema);