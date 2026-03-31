
import { OrderItem } from './order_items.model.js';

export const createOrderItem = async (req, res) => {
  try {
    const orderItem = new OrderItem(req.body);
    await orderItem.save();
    res.status(201).send(orderItem);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getAllOrderItems = async (req, res) => {
  try {
    const orderItems = await OrderItem.find({});
    res.send(orderItems);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id);
    if (!orderItem) {
      return res.status(404).send();
    }
    res.send(orderItem);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const updateOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!orderItem) {
      return res.status(404).send();
    }
    res.send(orderItem);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const deleteOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findByIdAndDelete(req.params.id);
    if (!orderItem) {
      return res.status(404).send();
    }
    res.send(orderItem);
  } catch (error) {
    res.status(500).send(error);
  }
};
