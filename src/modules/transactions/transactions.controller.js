import Transaction from "./transactions.model.js";

export const createTransaction = async (req, res) => {
  try {
    const newTransaction = await Transaction.create(req.body);
    res.status(201).json({ success: true, data: newTransaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("invoice_id")
      .sort({ created_at: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionByInvoice = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ invoice_id: req.params.invoiceId });
    if (!transaction) return res.status(404).json({ success: false, message: "Giao dịch không tồn tại" });
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};