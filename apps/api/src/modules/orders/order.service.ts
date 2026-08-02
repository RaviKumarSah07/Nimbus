import dayjs from "dayjs";
import type { OrderStatus, Prisma } from "@ecommerce/db";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { recordAudit } from "../../utils/audit";
import { buildPaginatedResult } from "../../utils/response";
import { CUSTOMER_CANCELLABLE_STATUSES, ORDER_STATUS_TRANSITIONS } from "@ecommerce/shared";
import type { CartView } from "../cart/cart.types";
import type { AppliedDiscount } from "../coupons/coupon.service";
import { calculateShipping, calculateTax } from "../../config/commerce";
import { notifyUser, notifyAdmins } from "../notifications/notification.service";
import { pushToUser, pushToAdmins } from "../../lib/realtime";
import { clearCart } from "../cart/cart.service";
import type { CartIdentity } from "../cart/cart.types";

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

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

/** Idempotent - safe to call more than once for the same order (Stripe may retry webhook delivery). `guestToken` is only consulted when the order has no `userId`. */
export async function markOrderPaid(orderId: string, paymentIntentId?: string, guestToken?: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw ApiError.notFound(`Order ${orderId} not found`);
    if (order.paymentStatus === "PAID") return null;

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

    const result = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: "PAID", paymentIntentId, placedAt: new Date() },
    });

    await tx.orderStatusHistory.create({ data: { orderId, status: "PAID", note: "Payment confirmed" } });
    logger.info("Order paid", { orderId, orderNumber: order.orderNumber });

    return result;
  });

  // Only on the real transition - a retried webhook hitting the early
  // idempotency return above must not send a second "order placed" alert.
  if (updated) {
    // Cleared before the "Cart" push below fires, not after - a client that
    // refetches the instant it's notified would otherwise win the race and
    // read the cart before this has actually run, showing the just-paid
    // items as if checkout had done nothing.
    const cartIdentity: CartIdentity | undefined = updated.userId ? { userId: updated.userId } : guestToken ? { guestToken } : undefined;
    if (cartIdentity) await clearCart(cartIdentity);

    await notifyAdmins({
      type: "ORDER_PLACED",
      title: "New order placed",
      message: `Order ${updated.orderNumber} for ${formatMoney(Number(updated.grandTotal), updated.currency)} was just paid.`,
      link: `/admin/orders/${updated.id}`,
      tags: ["AdminOrder", "AdminDashboard"],
    });

    if (updated.userId) {
      await notifyUser({
        recipientId: updated.userId,
        type: "ORDER_PLACED",
        title: "Order confirmed",
        message: `Your order ${updated.orderNumber} has been placed and payment confirmed.`,
        link: `/account/orders/${updated.id}`,
        // Cart included - this is the moment the paid-for items actually
        // leave it, so any other open tab/device needs to know right away.
        tags: ["Order", "Cart"],
      });
    }
  }

  return updated;
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

  const wasPaid = order.paymentStatus === "PAID";

  const updated = await prisma.$transaction(async (tx) => {
    if (wasPaid) await restockOrderItems(tx, orderId);

    // Restocking reverses the sale, so the payment record has to follow -
    // otherwise a cancelled-after-payment order stays "PAID" forever and
    // permanently inflates revenue for a sale that no longer exists.
    const result = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", ...(wasPaid ? { paymentStatus: "REFUNDED" } : {}) },
    });
    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note: reason, changedByUserId: userId } });
    return result;
  });

  await notifyAdmins({
    type: "ORDER_CANCELLED",
    title: "Customer cancelled an order",
    message: `Order ${updated.orderNumber} was cancelled by the customer: "${reason}"`,
    link: `/admin/orders/${updated.id}`,
    tags: ["AdminOrder", "AdminDashboard"],
  });
  // The acting tab already gets a fresh Order list via the mutation's own
  // invalidatesTags - this covers any other tab/device the customer has open.
  pushToUser(userId, ["Order"]);

  return updated;
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

interface StatusNotificationContent {
  type: "ORDER_PROCESSING" | "ORDER_SHIPPED" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | "ORDER_RETURNED";
  title: string;
  message: string;
}

function buildStatusNotification(
  status: OrderStatus,
  orderNumber: string,
  trackingNumber: string | null,
  courier: string | null,
): StatusNotificationContent | null {
  switch (status) {
    case "PROCESSING":
      return { type: "ORDER_PROCESSING", title: "Order is being processed", message: `Order ${orderNumber} is now being prepared for shipment.` };
    case "SHIPPED": {
      const shipmentDetail = trackingNumber ? ` Tracking: ${trackingNumber}${courier ? ` (${courier})` : ""}.` : "";
      return { type: "ORDER_SHIPPED", title: "Order shipped", message: `Order ${orderNumber} is on its way.${shipmentDetail}` };
    }
    case "DELIVERED":
      return { type: "ORDER_DELIVERED", title: "Order delivered", message: `Order ${orderNumber} was delivered. We hope you enjoy it!` };
    case "CANCELLED":
      return { type: "ORDER_CANCELLED", title: "Order cancelled", message: `Order ${orderNumber} was cancelled by our team.` };
    case "RETURNED":
      return { type: "ORDER_RETURNED", title: "Order marked as returned", message: `Order ${orderNumber} has been marked as returned.` };
    default:
      return null;
  }
}

export async function updateOrderStatusAdmin(
  orderId: string,
  nextStatus: OrderStatus,
  note: string | undefined,
  adminUserId: string,
  trackingNumber?: string,
  courier?: string,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound("Order not found");

  const allowed = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`Cannot move an order from "${order.status}" to "${nextStatus}"`);
  }

  const isReversal = (nextStatus === "CANCELLED" || nextStatus === "RETURNED") && order.paymentStatus === "PAID";

  const updated = await prisma.$transaction(async (tx) => {
    if (isReversal) await restockOrderItems(tx, orderId);

    const result = await tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        // Restocking reverses the sale, so the payment record has to
        // follow - otherwise a cancelled/returned order stays "PAID"
        // forever and permanently inflates revenue for a sale that no
        // longer exists.
        ...(isReversal ? { paymentStatus: "REFUNDED" } : {}),
        // Only ever set on the Shipped transition in the UI, but persisted
        // unconditionally here so a correction (wrong tracking number typed
        // in) can be re-sent without forcing another status change.
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(courier ? { courier } : {}),
      },
    });
    await tx.orderStatusHistory.create({ data: { orderId, status: nextStatus, note, changedByUserId: adminUserId } });
    return result;
  });

  await recordAudit({ actorUserId: adminUserId, action: "order.status_update", entityType: "Order", entityId: orderId, metadata: { from: order.status, to: nextStatus } });

  const content = buildStatusNotification(nextStatus, updated.orderNumber, updated.trackingNumber, updated.courier);
  if (content && updated.userId) {
    await notifyUser({ recipientId: updated.userId, ...content, link: `/account/orders/${updated.id}`, tags: ["Order"] });
  }
  // The acting admin's own tab already gets a fresh order/dashboard via the
  // mutation's own invalidatesTags - this covers any other connected admin.
  pushToAdmins(["AdminOrder", "AdminDashboard"]);

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
