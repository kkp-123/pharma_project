import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: {
    type: String,
    required: true
  },

  type: {
    type: String, // leave, salary, inventory, system
    default: "system"
  },

  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);