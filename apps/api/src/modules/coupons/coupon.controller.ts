import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as couponService from "./coupon.service";

export const validate = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const { coupon, discountAmount } = await couponService.validateCouponForSubtotal(code, subtotal);
  sendSuccess(res, { code: coupon.code, type: coupon.type, value: Number(coupon.value), discountAmount });
});

export const listAdmin = asyncHandler(async (_req, res) => {
  const coupons = await couponService.listCouponsAdmin();
  sendSuccess(res, coupons);
});

export const create = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body, req.user!.id);
  sendSuccess(res, coupon, 201);
});

export const update = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body, req.user!.id);
  sendSuccess(res, coupon);
});

export const remove = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id, req.user!.id);
  sendSuccess(res, { deleted: true });
});
