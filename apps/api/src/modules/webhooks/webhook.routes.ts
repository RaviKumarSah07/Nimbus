import { Router } from "express";
import express from "express";
import type Stripe from "stripe";
import { stripeGateway } from "../payments/paymentGateway";
import * as orderService from "../orders/order.service";
import * as cartService from "../cart/cart.service";
import { logger } from "../../utils/logger";

export const stripeWebhookRouter = Router();

// Stripe signs the exact raw bytes it sent, so this route needs the
// untouched body - express.json() (mounted globally in app.ts, after this
// router) would have already parsed and re-serialized it, breaking the
// signature check.
stripeWebhookRouter.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripeGateway) {
    logger.warn("Received Stripe webhook but no STRIPE_SECRET_KEY is configured - ignoring");
    return res.status(200).json({ received: true, ignored: true });
  }

  const signature = req.header("stripe-signature");
  if (!signature) return res.status(400).send("Missing stripe-signature header");

  let event: Stripe.Event;
  try {
    event = stripeGateway.verifyAndParseWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", { error: (err as Error).message });
    return res.status(400).send(`Webhook signature verification failed`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.client_reference_id;
        if (!orderId) break;

        await orderService.markOrderPaid(orderId, typeof session.payment_intent === "string" ? session.payment_intent : undefined);

        const guestToken = session.metadata?.guestToken;
        const order = await orderService.getOrderConfirmation(orderId);
        await cartService.clearCart(order.userId ? { userId: order.userId } : { guestToken: guestToken || undefined });
        break;
      }
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed": {
        const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
        const orderId = "client_reference_id" in object ? object.client_reference_id : undefined;
        if (orderId) await orderService.markOrderPaymentFailed(orderId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error("Error processing Stripe webhook", { type: event.type, error: (err as Error).message });
    // Still 200 - Stripe retries on non-2xx, and re-processing a broken
    // handler won't fix itself. The failure is already logged for follow-up.
  }

  res.status(200).json({ received: true });
});
