import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    // Role (Admin / Manager / Employee)
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee"
    },

    // Department
    department: {
      type: String,
      enum: ["QC", "Production", "Sales", "Inventory", "HR"],
      required: true
    },

    // Manager (for employee → links to manager)
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Contact Details
    phone: {
      type: String
    },

    address: {
      type: String
    },

    overtimeRate: {
      type: Number,
      default: 100 // ₹ per hour (you can change default)
    },

    // Job Details
    joiningDate: {
      type: Date,
      default: Date.now
    },

    salary: {
      type: Number,
      default: 0
    },

    // Leave Balance
      leaveBalance: {
        casual: {
          type: Number,
          default: 10
        },
        sick: {
          type: Number,
          default: 5
        },
        paid: {
          type: Number,
          default: 12
        }
      },

    // Account Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Face Recognition Data
    faceData: {
      registered: {
        type: Boolean,
        default: false
      },
      descriptor: {
        type: [Number],
        default: []
      },
      registeredAt: {
        type: Date
      },
      lastUpdatedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// userSchema.index({ email: 1 });
// userSchema.index({ department: 1, role: 1 });
// userSchema.index({ manager: 1 });

export default mongoose.model("User", userSchema);