import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().trim().min(2).max(150),
  imageUrl: z.string().url(),
  linkUrl: z.string().trim().max(300).optional(),
  position: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type CreateBannerInput = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = createBannerSchema.partial();
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
