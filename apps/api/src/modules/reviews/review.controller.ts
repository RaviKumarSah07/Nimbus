import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as reviewService from "./review.service";

export const listForProduct = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const result = await reviewService.listReviewsForProduct(req.params.productId, page, limit);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user!.id, req.params.productId, req.body);
  sendSuccess(res, review, 201);
});

export const removeAdmin = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  sendSuccess(res, { deleted: true });
});

export const listAdmin = asyncHandler(async (req, res) => {
  const result = await reviewService.listReviewsAdmin(req.query as never);
  sendSuccess(res, result);
});
