import Transaction from "./transactions.model.js";

export const createTransaction = async (req, res) => {
  try {
    const newTransaction = await Transaction.create(req.body);
    res.status(201).json({ success: true, data: newTransaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};