import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(3000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
