import type { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import * as cartService from "./cart.service";
import type { CartIdentity } from "./cart.types";

const GUEST_TOKEN_HEADER = "x-guest-cart-token";

function getIdentity(req: Request): CartIdentity {
  if (req.user) return { userId: req.user.id };
  const guestToken = req.header(GUEST_TOKEN_HEADER);
  return guestToken ? { guestToken } : {};
}

export const getCart = asyncHandler(async (req, res) => {
  const identity = getIdentity(req);
  if (!identity.userId && !identity.guestToken) {
    return sendSuccess(res, { id: null, items: [], subtotal: 0, itemCount: 0 });
  }
  const cart = await cartService.getCart(identity);
  sendSuccess(res, cart);
});

export const addItem = asyncHandler(async (req, res) => {
  const identity = getIdentity(req);
  if (!identity.userId && !identity.guestToken) throw ApiError.badRequest("Missing guest cart token");
  const cart = await cartService.addItem(identity, req.body.variantId, req.body.quantity);
  sendSuccess(res, cart, 201);
});

export const updateItem = asyncHandler(async (req, res) => {
  const identity = getIdentity(req);
  if (!identity.userId && !identity.guestToken) throw ApiError.badRequest("Missing guest cart token");
  const cart = await cartService.updateItemQuantity(identity, req.params.itemId, req.body.quantity);
  sendSuccess(res, cart);
});

export const removeItem = asyncHandler(async (req, res) => {
  const identity = getIdentity(req);
  if (!identity.userId && !identity.guestToken) throw ApiError.badRequest("Missing guest cart token");
  const cart = await cartService.removeItem(identity, req.params.itemId);
  sendSuccess(res, cart);
});

export const mergeGuestCart = asyncHandler(async (req, res) => {
  const cart = await cartService.mergeGuestCartIntoUser(req.user!.id, req.body.guestToken);
  sendSuccess(res, cart);
});
