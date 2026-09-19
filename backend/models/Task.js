import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: String,

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    department: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending"
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    progressHistory: [
      {
        value: Number,
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // NEW: Comments
    comments: [commentSchema],

    dueDate: Date
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);