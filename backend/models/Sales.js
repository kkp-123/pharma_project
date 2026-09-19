import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, default: "cash" },
  note: String,
  date: { type: Date, default: Date.now }
});

const salesItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  quantity: { 
    type: Number, 
    required: true 
  },

  allocatedQuantity: {
    type: Number,
    default: 0
  },

  remainingQuantity: {
    type: Number
  },

  // 🔥 ADD THIS
  batchAllocations: [
    {
      batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch"
      },
      quantity: Number
    }
  ],

  price: { 
    type: Number, 
    required: true 
  },

  discount: { 
    type: Number, 
    default: 0 
  },

  total: { 
    type: Number 
  }
});

const salesSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    companyName: String,
    email: String,
    phone: String,
    address: String,
    notes: String,

    items: [salesItemSchema],

    totalAmount: { type: Number, default: 0 },
    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending"
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "partial",
        "production-required",
        "completed"
      ],
      default: "pending"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// ✅ ONLY FIX: safe number conversion (no logic change)
salesSchema.pre("save", function () {

  let total = 0;

  this.items.forEach((item) => {

    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);

    item.total =
      qty * price * (1 - discount / 100);

    // 🔥 NEW
    item.remainingQuantity =
      qty - (item.allocatedQuantity || 0);

    total += item.total;

  });

  this.totalAmount = total;

  this.dueAmount =
    total - (this.paidAmount || 0);

  // payment status
  if (this.paidAmount <= 0) {
    this.paymentStatus = "pending";
  }
  else if (this.paidAmount < total) {
    this.paymentStatus = "partial";
  }
  else {
    this.paymentStatus = "paid";
  }

});

export default mongoose.model("Sale", salesSchema);