import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(3000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const adminReviewQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verifiedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
});
export type AdminReviewQuery = z.infer<typeof adminReviewQuerySchema>;
