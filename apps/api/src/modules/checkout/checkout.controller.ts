import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as checkoutService from "./checkout.service";

const GUEST_TOKEN_HEADER = "x-guest-cart-token";

export const startCheckout = asyncHandler(async (req, res) => {
  const identity = req.user ? { userId: req.user.id } : { guestToken: req.header(GUEST_TOKEN_HEADER) };
  const result = await checkoutService.startCheckout(identity, req.body);
  sendSuccess(res, result, 201);
});

export const confirmCheckout = asyncHandler(async (req, res) => {
  const identity = req.user ? { userId: req.user.id } : { guestToken: req.header(GUEST_TOKEN_HEADER) };
  const result = await checkoutService.confirmCheckout(req.body.orderId, req.body.sessionId, identity);
  sendSuccess(res, result);
});
