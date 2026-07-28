import { z } from "zod";
import { COUPON_TYPES } from "../enums";

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.coerce.number().nonnegative(),
});
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((v) => v.toUpperCase()),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().positive(),
  minSubtotal: z.coerce.number().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
