import type { Prisma } from "@ecommerce/db";
import type { AdminReviewQuery, CreateReviewInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { buildPaginatedResult } from "../../utils/response";
import { recomputeProductRating } from "../catalog/product.service";

export async function listReviewsForProduct(productId: string, page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where: { productId } }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function createReview(userId: string, productId: string, input: CreateReviewInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.deletedAt) throw ApiError.notFound("Product not found");

  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
  if (existing) throw ApiError.conflict("You've already reviewed this product");

  const hasPurchased = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
  });

  const review = await prisma.review.create({
    data: {
      productId,
      userId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      isVerifiedPurchase: Boolean(hasPurchased),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  await recomputeProductRating(productId);
  return review;
}

export async function deleteReview(reviewId: string) {
  const review = await prisma.review.delete({ where: { id: reviewId } });
  await recomputeProductRating(review.productId);
}

// ---------- Admin ----------

/**
 * Deletion is the moderation action - there's no separate "hidden" flag.
 * A soft-hide would mean every review read path (this list, the public PDP
 * list, the rating aggregate) has to agree on what "visible" means; a hard
 * delete already correctly recomputes the rating and needs no second state
 * to keep in sync with it.
 */
export async function listReviewsAdmin(query: AdminReviewQuery) {
  const where: Prisma.ReviewWhereInput = {};

  if (query.rating !== undefined) where.rating = query.rating;
  if (query.verifiedOnly) where.isVerifiedPurchase = true;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { body: { contains: query.q, mode: "insensitive" } },
      { product: { name: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return buildPaginatedResult(rows, total, query.page, query.limit);
}
