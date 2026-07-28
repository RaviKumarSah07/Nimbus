import { z } from "zod";
import { PRODUCT_SORT_OPTIONS } from "../enums";

const coercedInt = (min: number, max: number, fallback: number) =>
  z.coerce.number().int().min(min).max(max).catch(fallback);

export const productQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  onSale: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort: z.enum(PRODUCT_SORT_OPTIONS).optional().default("newest"),
  page: coercedInt(1, 10_000, 1),
  limit: coercedInt(1, 60, 20),
});
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const productVariantInputSchema = z.object({
  id: z.string().cuid().optional(),
  sku: z.string().trim().min(1).max(60),
  size: z.string().trim().max(30).optional(),
  color: z.string().trim().max(30).optional(),
  priceOverride: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional(),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;

export const productImageInputSchema = z.object({
  url: z.string().url(),
  altText: z.string().trim().max(150).optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().trim().min(10).max(10_000),
  categoryId: z.string().cuid(),
  brandId: z.string().cuid().optional(),
  basePrice: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  images: z.array(productImageInputSchema).max(10).optional(),
  variants: z.array(productVariantInputSchema).min(1, "At least one variant is required"),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(productVariantInputSchema).optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
