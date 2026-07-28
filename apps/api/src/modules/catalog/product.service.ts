import type { Prisma } from "@ecommerce/db";
import type { CreateProductInput, ProductQueryInput, UpdateProductInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { buildPaginatedResult } from "../../utils/response";
import { cacheGet, cacheSet, cacheDeleteByPrefix } from "../../lib/redis";
import { recordAudit } from "../../utils/audit";
import { resolveCategoryIdsBySlug } from "./category.service";

const LIST_CACHE_PREFIX = "products:list:";
const LIST_CACHE_TTL_SECONDS = 60;

const listItemSelect = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  compareAtPrice: true,
  currency: true,
  isFeatured: true,
  avgRating: true,
  ratingCount: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: { select: { url: true, altText: true }, orderBy: { position: "asc" as const }, take: 1 },
  variants: { select: { stock: true, priceOverride: true } },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof listItemSelect }>;

function toListItem(product: ProductListRow) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const prices = product.variants.map((v) => Number(v.priceOverride ?? product.basePrice));
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    currency: product.currency,
    isFeatured: product.isFeatured,
    avgRating: Number(product.avgRating),
    ratingCount: product.ratingCount,
    category: product.category,
    brand: product.brand,
    image: product.images[0] ?? null,
    inStock: totalStock > 0,
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  };
}

async function buildWhereClause(query: ProductQueryInput): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.category) {
    const categoryIds = await resolveCategoryIdsBySlug(query.category);
    where.categoryId = { in: categoryIds.length ? categoryIds : ["__none__"] };
  }

  if (query.brand) {
    where.brand = { slug: query.brand };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  if (query.minRating !== undefined) {
    where.avgRating = { gte: query.minRating };
  }

  if (query.inStock === true) {
    where.variants = { some: { stock: { gt: 0 } } };
  } else if (query.inStock === false) {
    where.variants = { none: { stock: { gt: 0 } } };
  }

  if (query.onSale === true) {
    where.compareAtPrice = { not: null };
  }

  if (query.featured !== undefined) {
    where.isFeatured = query.featured;
  }

  return where;
}

function buildOrderBy(sort: ProductQueryInput["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ basePrice: "asc" }];
    case "price_desc":
      return [{ basePrice: "desc" }];
    case "rating":
      return [{ avgRating: "desc" }, { ratingCount: "desc" }];
    case "popularity":
      // Real relational signal (units ordered), not a denormalized guess.
      return [{ orderItems: { _count: "desc" } }, { avgRating: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProducts(query: ProductQueryInput) {
  const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(query)}`;
  const cached = await cacheGet<ReturnType<typeof buildPaginatedResult>>(cacheKey);
  if (cached) return cached;

  const where = await buildWhereClause(query);
  const orderBy = buildOrderBy(query.sort);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: listItemSelect,
    }),
    prisma.product.count({ where }),
  ]);

  const result = buildPaginatedResult(rows.map(toListItem), total, query.page, query.limit);
  await cacheSet(cacheKey, result, LIST_CACHE_TTL_SECONDS);
  return result;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      category: { include: { parent: true } },
      brand: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) throw ApiError.notFound("Product not found");

  const ratingBreakdown = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId: product.id },
    _count: { rating: true },
  });
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratingBreakdown.find((r) => r.rating === star)?._count.rating ?? 0,
  }));

  return {
    ...product,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    avgRating: Number(product.avgRating),
    variants: product.variants.map((v) => ({ ...v, priceOverride: v.priceOverride ? Number(v.priceOverride) : null })),
    ratingBreakdown: breakdown,
  };
}

export async function getRelatedProducts(productId: string, limit = 8) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
  if (!product) return [];

  const rows = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: productId }, isActive: true, deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
    take: limit,
    select: listItemSelect,
  });
  return rows.map(toListItem);
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, deletedAt: null },
    select: listItemSelect,
  });
  const items = rows.map(toListItem);
  // Preserve the caller's order (most-recently-viewed first).
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

// ---------- Admin ----------

export async function listProductsAdmin(page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, brand: true, variants: true, images: true },
    }),
    prisma.product.count({ where: { deletedAt: null } }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function getProductByIdAdmin(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, variants: true, images: { orderBy: { position: "asc" } } },
  });
  if (!product || product.deletedAt) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput, actorUserId: string) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      brandId: input.brandId,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      isFeatured: input.isFeatured ?? false,
      isActive: input.isActive ?? true,
      images: input.images?.length ? { create: input.images } : undefined,
      variants: { create: input.variants },
    },
    include: { images: true, variants: true },
  });
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "product.create", entityType: "Product", entityId: product.id, metadata: { name: product.name } });
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, actorUserId: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw ApiError.notFound("Product not found");

  const { variants, images, ...scalarFields } = input;

  const product = await prisma.$transaction(async (tx) => {
    if (variants) {
      // Simplest correct strategy for a portfolio-scale admin: replace the
      // variant set atomically rather than diffing individual rows. Existing
      // variant ids referenced by past orders are preserved via SetNull, not
      // deleted data loss, since OrderItem stores its own price/name snapshot.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: variants.map((v) => ({ ...v, productId: id })),
      });
    }
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({ data: images.map((img, i) => ({ ...img, position: img.position ?? i, productId: id })) });
    }
    return tx.product.update({
      where: { id },
      data: scalarFields,
      include: { images: true, variants: true },
    });
  });

  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "product.update", entityType: "Product", entityId: id, metadata: { fields: Object.keys(input) } });
  return product;
}

export async function softDeleteProduct(id: string, actorUserId: string) {
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "product.delete", entityType: "Product", entityId: id });
}

/** Recomputes the denormalized avgRating/ratingCount on Product from the Review table - called whenever a review is created or removed. */
export async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
  });
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
}
