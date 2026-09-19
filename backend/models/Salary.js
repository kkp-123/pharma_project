import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    month: {
      type: String,
      required: true
    },

    payslipNumber: {
      type: String,
      default: ""
    },

    // Corporate Earnings Breakdown
    baseSalary: { type: Number, required: true },
    basicPay: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },

    // Attendance & Days Metrics
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },

    // Overtime & Bonus
    overtimeHours: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },

    // Deductions
    pf: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    attendanceDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },

    // Final Net Pay
    netSalary: { type: Number, required: true },

    // Payment Status
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paymentMethod: {
      type: String,
      default: "bank_transfer"
    }
  },
  { timestamps: true }
);

salarySchema.index({ employee: 1, month: 1 }, { unique: true });
salarySchema.index({ month: 1, isPaid: 1 });

export default mongoose.model("Salary", salarySchema);