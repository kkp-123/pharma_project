import mongoose from "mongoose";

const bonusSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  amount: {
    type: Number,
    required: true
  },

  month: {
    type: String, // "2026-03"
    required: true
  },

  reason: String,

  isPaid: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Bonus", bonusSchema);