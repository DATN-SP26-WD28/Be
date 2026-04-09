
import { OrderItem } from './order_items.model.js';
import { Order } from '../orders/orders.model.js';
import { getIO } from '../../shared/utils/socket.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../shared/constants/socket.constants.js';

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
    const prevOrderItem = await OrderItem.findById(req.params.id);
    const orderItem = await OrderItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!orderItem) {
      return res.status(404).send();
    }

    if (prevOrderItem?.status !== orderItem?.status) {
      const order = await Order.findById(orderItem.order_id).populate('table_id', 'table_number');
      const tableId = order?.table_id?._id?.toString() || order?.table_id?.toString();
      const tableNumber = order?.table_id?.table_number?.toString();
      const io = getIO();

      if (io) {
        const payload = {
          itemId: orderItem?._id?.toString(),
          orderId: orderItem?.order_id?.toString(),
          tableId,
          tableNumber,
          oldStatus: prevOrderItem?.status,
          newStatus: orderItem?.status,
          updatedAt: orderItem?.updatedAt,
        };

        io.to(SOCKET_ROOMS.ADMIN_ORDERS).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
        if (payload.orderId) {
          io.to(SOCKET_ROOMS.order(payload.orderId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
        }
        if (tableId) {
          io.to(SOCKET_ROOMS.table(tableId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
        }
        if (tableNumber) {
          io.to(SOCKET_ROOMS.table(tableNumber)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
        }
      }
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
