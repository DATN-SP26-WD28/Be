import Feedback from "./feedbacks.model.js";

export const createFeedback = async (req, res) => {
  try {
    const newFeedback = await Feedback.create(req.body);
    res.status(201).json({ success: true, data: newFeedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user_id dish_id order_id", "username dish_name status")
      .sort({ created_at: -1 });
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy để xóa" });
    res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};