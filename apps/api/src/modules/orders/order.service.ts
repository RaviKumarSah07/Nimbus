import dayjs from "dayjs";
import type { OrderStatus, Prisma } from "@ecommerce/db";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { recordAudit } from "../../utils/audit";
import { buildPaginatedResult } from "../../utils/response";
import { CUSTOMER_CANCELLABLE_STATUSES } from "@ecommerce/shared";
import type { CartView } from "../cart/cart.types";
import type { AppliedDiscount } from "../coupons/coupon.service";
import { calculateShipping, calculateTax } from "../../config/commerce";

export function generateOrderNumber(): string {
  const datePart = dayjs().format("YYYYMMDD");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

interface CreatePendingOrderParams {
  userId?: string;
  guestEmail?: string;
  cart: CartView;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  discount?: AppliedDiscount;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export function computeOrderTotals(subtotal: number, discountAmount: number): OrderTotals {
  const discountTotal = Math.min(discountAmount, subtotal);
  const shippingTotal = calculateShipping(subtotal);
  const taxTotal = calculateTax(subtotal - discountTotal);
  const grandTotal = Math.round((subtotal - discountTotal + shippingTotal + taxTotal) * 100) / 100;
  return { subtotal, discountTotal, shippingTotal, taxTotal, grandTotal };
}

export async function createPendingOrder(params: CreatePendingOrderParams) {
  if (params.cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

  const overstockedItem = params.cart.items.find((item) => item.quantity > item.availableStock);
  if (overstockedItem) {
    throw ApiError.conflict(`${overstockedItem.productName} only has ${overstockedItem.availableStock} left in stock`);
  }

  const totals = computeOrderTotals(params.cart.subtotal, params.discount?.discountAmount ?? 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: params.userId,
      guestEmail: params.guestEmail,
      status: "PENDING",
      paymentStatus: "UNPAID",
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      couponId: params.discount?.coupon.id,
      shippingAddress: params.shippingAddress as never,
      billingAddress: params.billingAddress as never,
      items: {
        create: params.cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          nameSnapshot: item.productName,
          variantSnapshot: [item.color, item.size].filter(Boolean).join(" / ") || null,
          priceSnapshot: item.unitPrice,
          quantity: item.quantity,
          imageSnapshot: item.image,
        })),
      },
      statusHistory: { create: { status: "PENDING", note: "Order created, awaiting payment" } },
    },
    include: { items: true },
  });

  return order;
}

/** Idempotent - safe to call more than once for the same order (Stripe may retry webhook delivery). */
export async function markOrderPaid(orderId: string, paymentIntentId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw ApiError.notFound(`Order ${orderId} not found`);
    if (order.paymentStatus === "PAID") return order;

    for (const item of order.items) {
      if (!item.variantId) continue;
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        logger.warn("Selling through zero stock - payment was already captured", { orderId, variantId: item.variantId });
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: 0 } });
      }
      await tx.inventoryLog.create({
        data: { variantId: item.variantId, change: -item.quantity, reason: "ORDER", referenceId: order.id },
      });
    }

    if (order.couponId) {
      await tx.coupon.update({ where: { id: order.couponId }, data: { usageCount: { increment: 1 } } });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: "PAID", paymentIntentId, placedAt: new Date() },
    });

    await tx.orderStatusHistory.create({ data: { orderId, status: "PAID", note: "Payment confirmed" } });
    logger.info("Order paid", { orderId, orderNumber: order.orderNumber });

    return updated;
  });
}

export async function markOrderPaymentFailed(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") return;

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
  await prisma.orderStatusHistory.create({ data: { orderId, status: order.status, note: "Payment failed" } });
  logger.warn("Order payment failed", { orderId });
}

export async function listMyOrders(userId: string, page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true },
    }),
    prisma.order.count({ where: { userId } }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } }, returnRequests: true, coupon: true },
  });
  if (!order || order.userId !== userId) throw ApiError.notFound("Order not found");
  return order;
}

/** Public by design - the order id itself (an unguessable cuid) is the access token, the same pattern a hosted checkout's own confirmation URL uses. Lets a guest see their receipt with no account. */
export async function getOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

async function restockOrderItems(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (!item.variantId) continue;
    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    await tx.inventoryLog.create({
      data: { variantId: item.variantId, change: item.quantity, reason: "ADJUSTMENT", referenceId: orderId },
    });
  }
}

export async function cancelOrder(userId: string, orderId: string, reason: string) {
  const order = await getOrderForUser(userId, orderId);
  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(`Orders in "${order.status}" status can no longer be cancelled`);
  }

  return prisma.$transaction(async (tx) => {
    if (order.paymentStatus === "PAID") await restockOrderItems(tx, orderId);

    const updated = await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note: reason, changedByUserId: userId } });
    return updated;
  });
}

export async function requestReturn(userId: string, orderId: string, orderItemId: string, reason: string) {
  const order = await getOrderForUser(userId, orderId);
  if (order.status !== "DELIVERED") {
    throw ApiError.conflict("Only delivered orders are eligible for a return request");
  }
  const item = order.items.find((i) => i.id === orderItemId);
  if (!item) throw ApiError.notFound("Order item not found");

  return prisma.returnRequest.create({ data: { orderId, orderItemId, reason } });
}

// ---------- Admin ----------

export async function listOrdersAdmin(page: number, limit: number, status?: OrderStatus) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { items: true, user: true } }),
    prisma.order.count({ where }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function getOrderAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } }, returnRequests: true, user: true, coupon: true },
  });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function updateOrderStatusAdmin(orderId: string, nextStatus: OrderStatus, note: string | undefined, adminUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound("Order not found");

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`Cannot move an order from "${order.status}" to "${nextStatus}"`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if ((nextStatus === "CANCELLED" || nextStatus === "RETURNED") && order.paymentStatus === "PAID") {
      await restockOrderItems(tx, orderId);
    }
    const result = await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });
    await tx.orderStatusHistory.create({ data: { orderId, status: nextStatus, note, changedByUserId: adminUserId } });
    return result;
  });

  await recordAudit({ actorUserId: adminUserId, action: "order.status_update", entityType: "Order", entityId: orderId, metadata: { from: order.status, to: nextStatus } });
  return updated;
}

export async function listReturnRequestsAdmin() {
  return prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, userId: true } }, orderItem: true },
  });
}

export async function updateReturnRequestStatusAdmin(returnRequestId: string, status: "APPROVED" | "REJECTED" | "COMPLETED", adminUserId: string) {
  const returnRequest = await prisma.returnRequest.update({ where: { id: returnRequestId }, data: { status } });
  await recordAudit({ actorUserId: adminUserId, action: "return.status_update", entityType: "ReturnRequest", entityId: returnRequestId, metadata: { status } });
  return returnRequest;
}
