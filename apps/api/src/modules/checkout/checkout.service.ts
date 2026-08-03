import type { CheckoutInput } from "@ecommerce/shared";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";
import { logger } from "../../utils/logger";
import * as cartService from "../cart/cart.service";
import * as orderService from "../orders/order.service";
import * as couponService from "../coupons/coupon.service";
import { paymentGateway, stripeGateway } from "../payments/paymentGateway";
import type { CartIdentity } from "../cart/cart.types";

export async function startCheckout(identity: CartIdentity, input: CheckoutInput) {
  if (!identity.userId && !input.guestEmail) {
    throw ApiError.badRequest("An email address is required for guest checkout");
  }

  const cart = await cartService.getCart(identity);
  if (cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

  const discount = input.couponCode ? await couponService.validateCouponForSubtotal(input.couponCode, cart.subtotal) : undefined;

  const billingAddress = input.billingSameAsShipping === false && input.billingAddress ? input.billingAddress : input.shippingAddress;

  const order = await orderService.createPendingOrder({
    userId: identity.userId,
    guestEmail: identity.userId ? undefined : input.guestEmail,
    cart,
    shippingAddress: input.shippingAddress,
    billingAddress,
    discount,
  });

  const session = await paymentGateway.createCheckoutSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.grandTotal),
    currency: order.currency,
    customerEmail: input.guestEmail,
    guestToken: identity.guestToken,
  });

  if (session.immediatelyPaid) {
    // markOrderPaid clears the cart itself, before it notifies anyone the
    // order is paid - see the comment there for why the ordering matters.
    await orderService.markOrderPaid(order.id, session.providerSessionId, identity.guestToken);
  }

  return { checkoutUrl: session.checkoutUrl, orderId: order.id, orderNumber: order.orderNumber };
}

/**
 * Confirms payment from the success page the gateway redirects back to.
 *
 * The Stripe webhook is still the authoritative confirmation, but it is not a
 * guarantee: it can be delayed, its endpoint can be unconfigured, and in local
 * development Stripe cannot reach the machine at all without `stripe listen`.
 * Relying on it alone meant a real, completed payment could leave the order
 * PENDING forever - cart never cleared, admin showing "unpaid", revenue never
 * counted - which is exactly what happened here.
 *
 * This never trusts the client about whether money moved. It asks Stripe, and
 * only accepts a session that Stripe reports as paid AND that Stripe says
 * belongs to this order, so a paid session id cannot be replayed against a
 * different order. Both this and the webhook funnel into the same idempotent
 * markOrderPaid, so whichever arrives first wins and the other is a no-op.
 */
export async function confirmCheckout(orderId: string, sessionId: string | undefined, identity: CartIdentity) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound("Order not found");

  // Already settled - by the webhook, by the mock gateway's immediate path, or
  // by an earlier call to this endpoint (a refresh of the success page).
  if (order.paymentStatus === "PAID") {
    return { orderId: order.id, paymentStatus: order.paymentStatus, status: order.status, alreadyConfirmed: true };
  }

  if (!stripeGateway) {
    // Mock gateway: startCheckout already marked it paid, so reaching here
    // means something genuinely failed rather than merely lagging.
    logger.warn("Confirm called for an unpaid order with no Stripe configured", { orderId });
    return { orderId: order.id, paymentStatus: order.paymentStatus, status: order.status, alreadyConfirmed: false };
  }

  if (!sessionId) throw ApiError.badRequest("A checkout session id is required to confirm this payment");

  const session = await stripeGateway.retrieveCheckoutSession(sessionId).catch((err: Error) => {
    logger.warn("Could not retrieve Stripe session during confirmation", { orderId, error: err.message });
    throw ApiError.badRequest("That checkout session could not be verified");
  });

  if (session.client_reference_id !== orderId) {
    throw ApiError.badRequest("That checkout session does not belong to this order");
  }

  if (session.payment_status !== "paid") {
    return { orderId: order.id, paymentStatus: order.paymentStatus, status: order.status, alreadyConfirmed: false };
  }

  const updated = await orderService.markOrderPaid(
    orderId,
    typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    identity.guestToken ?? session.metadata?.guestToken ?? undefined,
  );

  return {
    orderId,
    paymentStatus: updated?.paymentStatus ?? "PAID",
    status: updated?.status ?? "PAID",
    alreadyConfirmed: false,
  };
}
