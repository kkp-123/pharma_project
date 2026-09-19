import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: String,
      required: true
    },

    checkIn: Date,
    checkOut: Date,

    totalHours: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["present", "absent", "half-day", "leave", "holiday"],
      default: "present"
    },

    // 📍 Location fields
    location: {
      lat: Number,
      lng: Number
    },
    checkInLocation: {
      lat: Number,
      lng: Number
    },
    checkOutLocation: {
      lat: Number,
      lng: Number
    },

    // 👤 Face Recognition & Verification
    faceVerified: {
      type: Boolean,
      default: false
    },
    faceConfidence: {
      type: Number,
      default: 0
    },
    verificationMethod: {
      type: String,
      enum: ["face", "manual", "admin", "location"],
      default: "location"
    },

    // ⏱ Time & Work Metrics
    lateMinutes: {
      type: Number,
      default: 0
    },
    earlyLeaveMinutes: {
      type: Number,
      default: 0
    },
    workingHours: {
      type: Number,
      default: 0
    },

    isHoliday: {
      type: Boolean,
      default: false
    },
    isSunday: {
      type: Boolean,
      default: false
    },
    isOvertime: {
      type: Boolean,
      default: false
    },
    overtimeHours: {
      type: Number,
      default: 0
    },

    // 📝 Notes & Manual Override Audit
    notes: {
      type: String,
      default: ""
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    modificationReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ date: 1 });

export default mongoose.model("Attendance", attendanceSchema);