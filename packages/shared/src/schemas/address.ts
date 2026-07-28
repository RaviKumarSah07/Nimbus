import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  line1: z.string().trim().min(3).max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2, "Use a 2-letter ISO country code"),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;
