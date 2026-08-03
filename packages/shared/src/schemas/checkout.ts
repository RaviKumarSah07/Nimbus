import { z } from "zod";
import { addressSchema } from "./address";
import { ORDER_STATUSES } from "../enums";

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  billingSameAsShipping: z.boolean().optional().default(true),
  couponCode: z.string().trim().max(40).optional(),
  guestEmail: z.string().trim().toLowerCase().email().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Sent by the success page the payment gateway redirects back to. sessionId is
// optional because the mock gateway has no session to verify - the order is
// already paid by the time that redirect happens.
export const confirmCheckoutSchema = z.object({
  orderId: z.string().cuid(),
  sessionId: z.string().trim().max(255).optional(),
});
export type ConfirmCheckoutInput = z.infer<typeof confirmCheckoutSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  courier: z.string().trim().max(100).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const returnRequestSchema = z.object({
  orderItemId: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
