import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    // Employee who applied
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Manager who approves
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Leave Type
    type: {
      type: String,
      enum: ["casual", "sick", "paid"],
      required: true
    },

    isPaid: {
      type: Boolean,
      default: true
    },

    // Dates
    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    // Reason
    reason: {
      type: String
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ manager: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Leave", leaveSchema);