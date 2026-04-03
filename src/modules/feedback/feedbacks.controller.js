import Feedback from "./feedbacks.model.js";

export const createFeedback = async (req, res) => {

  try {

    const newFeedback = await Feedback.create(req.body);

    res.status(201).json(newFeedback);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate("user_id dish_id", "username dish_name");
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
