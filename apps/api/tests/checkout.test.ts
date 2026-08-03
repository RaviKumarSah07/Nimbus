import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { CouponType } from "@ecommerce/db";
import { resetDatabase } from "./helpers/db";
import { createTestProduct } from "./helpers/fixtures";

const app = createApp();
const GUEST_TOKEN_HEADER = "x-guest-cart-token";

const shippingAddress = {
  fullName: "Test Buyer",
  phone: "5551234567",
  line1: "1 Test Way",
  city: "Austin",
  state: "TX",
  postalCode: "73301",
  country: "US",
};

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("checkout (no STRIPE_SECRET_KEY configured in tests, so the mock gateway pays instantly)", () => {
  it("creates a paid order, decrements stock, and clears the cart", async () => {
    const { variant } = await createTestProduct({ basePrice: 25, stock: 5 });
    const guestToken = "guest-checkout-test-1";

    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, guestToken).send({ variantId: variant.id, quantity: 2 });

    const checkout = await request(app)
      .post("/api/checkout")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ shippingAddress, guestEmail: "buyer@example.com" });

    expect(checkout.status).toBe(201);
    const { orderId } = checkout.body.data;

    const confirmation = await request(app).get(`/api/orders/confirmation/${orderId}`);
    expect(confirmation.body.data.status).toBe("PAID");
    expect(confirmation.body.data.paymentStatus).toBe("PAID");
    expect(Number(confirmation.body.data.subtotal)).toBeCloseTo(50, 2);

    const updatedVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updatedVariant.stock).toBe(3);

    const cartAfter = await request(app).get("/api/cart").set(GUEST_TOKEN_HEADER, guestToken);
    expect(cartAfter.body.data.itemCount).toBe(0);
  });

  it("rejects checkout with an empty cart", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .set(GUEST_TOKEN_HEADER, "guest-checkout-empty")
      .send({ shippingAddress, guestEmail: "empty@example.com" });
    expect(res.status).toBe(400);
  });

  it("rejects a coupon below its minimum subtotal, and applies a valid one correctly", async () => {
    const { variant } = await createTestProduct({ basePrice: 20, stock: 5 });
    await prisma.coupon.create({
      data: { code: "BIGSPENDER", type: CouponType.FIXED, value: 10, minSubtotal: 100, isActive: true },
    });

    const guestToken = "guest-checkout-coupon-test";
    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, guestToken).send({ variantId: variant.id, quantity: 1 });

    const tooSmall = await request(app)
      .post("/api/checkout")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ shippingAddress, guestEmail: "buyer@example.com", couponCode: "BIGSPENDER" });
    expect(tooSmall.status).toBe(400);

    // Bump the cart over the coupon's minimum subtotal and try again.
    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, guestToken).send({ variantId: variant.id, quantity: 4 });
    const checkout = await request(app)
      .post("/api/checkout")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ shippingAddress, guestEmail: "buyer@example.com", couponCode: "BIGSPENDER" });
    expect(checkout.status).toBe(201);

    const confirmation = await request(app).get(`/api/orders/confirmation/${checkout.body.data.orderId}`);
    expect(Number(confirmation.body.data.discountTotal)).toBeCloseTo(10, 2);
  });
});

/**
 * The success page calls this on the way back from the gateway so a completed
 * payment settles even when the webhook never arrives - which is what left real
 * paid orders stuck on PENDING, with the cart unemptied and the admin views
 * showing nothing. Stripe isn't configured in tests, so what's covered here is
 * the contract around the verification rather than the Stripe call itself.
 */
describe("checkout confirmation", () => {
  it("is idempotent - confirming an already-paid order reports it without changing anything", async () => {
    const { variant } = await createTestProduct({ basePrice: 25, stock: 5 });
    const guestToken = "guest-confirm-idempotent";

    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, guestToken).send({ variantId: variant.id, quantity: 2 });
    const checkout = await request(app)
      .post("/api/checkout")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ shippingAddress, guestEmail: "buyer@example.com" });
    const { orderId } = checkout.body.data;

    const stockAfterPayment = (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;

    const confirm = await request(app).post("/api/checkout/confirm").send({ orderId });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.paymentStatus).toBe("PAID");
    expect(confirm.body.data.alreadyConfirmed).toBe(true);

    // A second settlement would decrement stock twice and double-count revenue.
    const stockAfterConfirm = (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
    expect(stockAfterConfirm).toBe(stockAfterPayment);

    const history = await prisma.orderStatusHistory.count({ where: { orderId, status: "PAID" } });
    expect(history).toBe(1);
  });

  it("rejects an unknown order", async () => {
    const res = await request(app).post("/api/checkout/confirm").send({ orderId: "cl00000000000000000000000" });
    expect(res.status).toBe(404);
  });

  it("rejects a malformed request", async () => {
    const res = await request(app).post("/api/checkout/confirm").send({ orderId: "not-a-cuid" });
    expect(res.status).toBe(400);
  });
});
