import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(20),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
