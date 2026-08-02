import type { CheckoutInput } from "@ecommerce/shared";
import { ApiError } from "../../utils/ApiError";
import * as cartService from "../cart/cart.service";
import * as orderService from "../orders/order.service";
import * as couponService from "../coupons/coupon.service";
import { paymentGateway } from "../payments/paymentGateway";
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
