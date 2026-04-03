import Feedback from "./feedbacks.model.js";

export const createFeedback = async (req, res) => {

  try {

    const newFeedback = await Feedback.create(req.body);

    res.status(201).json(newFeedback);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};

