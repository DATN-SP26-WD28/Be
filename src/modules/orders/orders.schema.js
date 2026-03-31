import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const orderItemSchema = z.object({
  dish_id: z
    .string({ required_error: 'dish_id là bắt buộc' })
    .regex(objectIdRegex, 'dish_id không hợp lệ'),
  quantity: z
    .number({ required_error: 'quantity là bắt buộc' })
    .int('quantity phải là số nguyên')
    .positive('quantity phải lớn hơn 0'),
});

export const createOrderByStaffSchema = z.object({
  table_id: z
    .string({ required_error: 'table_id là bắt buộc' })
    .regex(objectIdRegex, 'table_id không hợp lệ'),
  items: z
    .array(orderItemSchema, { required_error: 'items là bắt buộc' })
    .min(1, 'Đơn hàng phải có ít nhất 1 món'),
  note: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional(),
});
