import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema({
  date: {
    type: String, // "2026-01-26"
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["public", "company"],
    default: "public"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Holiday", holidaySchema);