import type { CreateCouponInput, UpdateCouponInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../../utils/audit";
import type { Coupon } from "@ecommerce/db";

export interface AppliedDiscount {
  coupon: Coupon;
  discountAmount: number;
}

/** Shared by the "apply coupon" endpoint and checkout itself, so a coupon that passes preview always passes at checkout too. */
export async function validateCouponForSubtotal(code: string, subtotal: number): Promise<AppliedDiscount> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest("This coupon code is invalid or no longer active");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw ApiError.badRequest("This coupon isn't active yet");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw ApiError.badRequest("This coupon has expired");
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw ApiError.badRequest("This coupon has reached its usage limit");
  }
  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) {
    throw ApiError.badRequest(`This coupon requires a subtotal of at least ${Number(coupon.minSubtotal).toFixed(2)}`);
  }

  const discountAmount =
    coupon.type === "PERCENTAGE" ? Math.round(subtotal * (Number(coupon.value) / 100) * 100) / 100 : Math.min(Number(coupon.value), subtotal);

  return { coupon, discountAmount };
}

export async function listCouponsAdmin() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createCoupon(input: CreateCouponInput, actorUserId: string) {
  const coupon = await prisma.coupon.create({ data: input });
  await recordAudit({ actorUserId, action: "coupon.create", entityType: "Coupon", entityId: coupon.id, metadata: { code: coupon.code } });
  return coupon;
}

export async function updateCoupon(id: string, input: UpdateCouponInput, actorUserId: string) {
  const coupon = await prisma.coupon.update({ where: { id }, data: input });
  await recordAudit({ actorUserId, action: "coupon.update", entityType: "Coupon", entityId: id, metadata: { fields: Object.keys(input) } });
  return coupon;
}

export async function deleteCoupon(id: string, actorUserId: string) {
  await prisma.coupon.delete({ where: { id } });
  await recordAudit({ actorUserId, action: "coupon.delete", entityType: "Coupon", entityId: id });
}
