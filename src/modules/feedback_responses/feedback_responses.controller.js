import FeedbackResponse from "./feedback_responses.model.js";


export const replyFeedback = async (req, res) => {
  try {
    const response = await FeedbackResponse.create(req.body);
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getResponseByFeedback = async (req, res) => {
  try {
    const response = await FeedbackResponse.findOne({ feedback_id: req.params.feedbackId })
      .populate("admin_id", "username role");
    if (!response) return res.status(404).json({ success: false, message: "Chưa có phản hồi cho đánh giá này" });
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};