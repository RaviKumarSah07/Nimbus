import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as wishlistService from "./wishlist.service";

export const list = asyncHandler(async (req, res) => {
  const items = await wishlistService.listWishlist(req.user!.id);
  sendSuccess(res, items);
});

export const listIds = asyncHandler(async (req, res) => {
  const ids = await wishlistService.listWishlistedProductIds(req.user!.id);
  sendSuccess(res, ids);
});

export const add = asyncHandler(async (req, res) => {
  await wishlistService.addToWishlist(req.user!.id, req.params.productId);
  sendSuccess(res, { added: true }, 201);
});

export const remove = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlist(req.user!.id, req.params.productId);
  sendSuccess(res, { removed: true });
});
