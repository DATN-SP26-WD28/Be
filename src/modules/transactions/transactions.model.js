import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    cashier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Người thực hiện thu ngân
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    type: {
      type: String,
      maxLength: 50, // Ví dụ: 'cash', 'transfer', 'card'
    },
    status: {
      type: String,
      enum: ["completed", "canceled"],
      default: "completed",
    },
    amount_paid: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;