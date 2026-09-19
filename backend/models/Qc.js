import mongoose from "mongoose";

const qcSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },

  result: {
    type: String,
    enum: ["pass", "fail"],
    required: true
  },

  remarks: String,

  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export default mongoose.model("QC", qcSchema);