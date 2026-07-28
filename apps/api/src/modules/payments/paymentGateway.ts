import Stripe from "stripe";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

export interface CreateCheckoutSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  guestToken?: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  providerSessionId: string;
  /** true only for the mock gateway - there is no webhook to confirm it, so checkout.service marks the order paid synchronously. */
  immediatelyPaid?: boolean;
}

export interface PaymentGateway {
  readonly name: "stripe" | "mock";
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
}

class StripePaymentGateway implements PaymentGateway {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    // A single summary line item (rather than one per cart line) keeps this
    // decoupled from Stripe's own discount/tax primitives - our totals are
    // already authoritative by the time we get here, computed server-side
    // in checkout.service from our own coupon/shipping/tax rules.
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: `Nimbus order ${params.orderNumber}` },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      client_reference_id: params.orderId,
      customer_email: params.customerEmail,
      metadata: { orderId: params.orderId, guestToken: params.guestToken ?? "" },
      success_url: `${env.STRIPE_SUCCESS_URL}?orderId=${params.orderId}`,
      cancel_url: `${env.STRIPE_CANCEL_URL}?orderId=${params.orderId}`,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { checkoutUrl: session.url, providerSessionId: session.id };
  }

  verifyAndParseWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    return this.stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  }
}

/**
 * Lets the whole checkout flow run with zero external setup: no real
 * money moves and there's no webhook, so checkout.service marks the order
 * paid immediately and redirects straight to the success page.
 */
class MockPaymentGateway implements PaymentGateway {
  readonly name = "mock" as const;

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    logger.warn("STRIPE_SECRET_KEY not set - using mock payment gateway (no real charge is made)", { orderId: params.orderId });
    const providerSessionId = `mock_${params.orderId}`;
    return {
      checkoutUrl: `${env.STRIPE_SUCCESS_URL}?orderId=${params.orderId}&mock=1`,
      providerSessionId,
      immediatelyPaid: true,
    };
  }
}

export const stripeGateway = env.STRIPE_SECRET_KEY ? new StripePaymentGateway(env.STRIPE_SECRET_KEY) : null;
export const paymentGateway: PaymentGateway = stripeGateway ?? new MockPaymentGateway();
