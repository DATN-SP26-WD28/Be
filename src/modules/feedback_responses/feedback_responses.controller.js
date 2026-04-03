import FeedbackResponse from "./feedback_responses.model.js";


export const replyFeedback = async (req, res) => {

  try {

    const response = await FeedbackResponse.create(req.body);

    res.status(201).json(response);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};