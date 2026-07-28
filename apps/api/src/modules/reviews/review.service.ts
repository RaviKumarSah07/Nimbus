import type { CreateReviewInput } from "@ecommerce/shared";
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
    where: { productId, order: { userId, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } },
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
