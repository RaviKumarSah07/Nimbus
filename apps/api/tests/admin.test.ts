import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { Role } from "@ecommerce/db";
import { resetDatabase } from "./helpers/db";
import { createTestProduct, createTestUser } from "./helpers/fixtures";

const app = createApp();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAs(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data.accessToken as string;
}

describe("admin authorization", () => {
  it("rejects anonymous and customer requests, accepts admin requests", async () => {
    const { user: customer, password: customerPassword } = await createTestUser({ role: Role.CUSTOMER, email: "customer@test.local" });
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "admin@test.local" });
    void customer;

    const anonymous = await request(app).get("/api/admin/products");
    expect(anonymous.status).toBe(401);

    const customerToken = await loginAs("customer@test.local", customerPassword);
    const asCustomer = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${customerToken}`);
    expect(asCustomer.status).toBe(403);

    const adminToken = await loginAs("admin@test.local", adminPassword);
    const asAdmin = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);
  });

  it("blocks an admin from changing their own role", async () => {
    const { user: admin, password } = await createTestUser({ role: Role.ADMIN, email: "self-admin@test.local" });
    const token = await loginAs("self-admin@test.local", password);

    const res = await request(app).patch(`/api/admin/users/${admin.id}/role`).set("Authorization", `Bearer ${token}`).send({ role: "CUSTOMER" });
    expect(res.status).toBe(400);
  });
});

describe("order status transitions", () => {
  it("follows the allowed transition table and rejects illegal jumps", async () => {
    const { password } = await createTestUser({ role: Role.ADMIN, email: "order-admin@test.local" });
    const adminToken = await loginAs("order-admin@test.local", password);

    const { variant } = await createTestProduct({ basePrice: 10, stock: 5 });
    const guestToken = "guest-order-lifecycle-test";
    await request(app).post("/api/cart/items").set("x-guest-cart-token", guestToken).send({ variantId: variant.id, quantity: 1 });

    const checkout = await request(app)
      .post("/api/checkout")
      .set("x-guest-cart-token", guestToken)
      .send({
        shippingAddress: {
          fullName: "Order Tester",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
        guestEmail: "order-lifecycle@example.com",
      });
    const orderId = checkout.body.data.orderId;

    // Order is already PAID (mock gateway). PAID -> DELIVERED directly is illegal.
    const illegalJump = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "DELIVERED" });
    expect(illegalJump.status).toBe(400);

    // Skipping PROCESSING is illegal too now that it sits between PAID and SHIPPED.
    const skipsProcessing = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SHIPPED" });
    expect(skipsProcessing.status).toBe(400);

    const toProcessing = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PROCESSING" });
    expect(toProcessing.status).toBe(200);
    expect(toProcessing.body.data.status).toBe("PROCESSING");

    const toShipped = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SHIPPED", trackingNumber: "TRACK123", courier: "BlueDart" });
    expect(toShipped.status).toBe(200);
    expect(toShipped.body.data.status).toBe("SHIPPED");
    expect(toShipped.body.data.trackingNumber).toBe("TRACK123");
    expect(toShipped.body.data.courier).toBe("BlueDart");

    const toDelivered = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "DELIVERED" });
    expect(toDelivered.status).toBe(200);
  });
});

describe("order notifications", () => {
  it("notifies admins and the customer as an order moves through its lifecycle", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "notify-admin@test.local" });
    const adminToken = await loginAs("notify-admin@test.local", adminPassword);

    const { password: customerPassword } = await createTestUser({ role: Role.CUSTOMER, email: "notify-customer@test.local" });
    const customerToken = await loginAs("notify-customer@test.local", customerPassword);

    const { variant } = await createTestProduct({ basePrice: 25, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${customerToken}`).send({ variantId: variant.id, quantity: 1 });

    const checkout = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: "Notify Tester",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
      });
    const orderId = checkout.body.data.orderId;

    // Paying the order should alert both sides.
    const adminNotifs = await request(app).get("/api/notifications").set("Authorization", `Bearer ${adminToken}`);
    expect(adminNotifs.body.data.items.some((n: { type: string }) => n.type === "ORDER_PLACED")).toBe(true);
    expect(adminNotifs.body.data.unreadCount).toBeGreaterThan(0);

    const customerNotifsAfterPay = await request(app).get("/api/notifications").set("Authorization", `Bearer ${customerToken}`);
    expect(customerNotifsAfterPay.body.data.items.some((n: { type: string }) => n.type === "ORDER_PLACED")).toBe(true);

    // Each admin-driven status change should notify the customer, not the admin who made it.
    await request(app).patch(`/api/admin/orders/${orderId}/status`).set("Authorization", `Bearer ${adminToken}`).send({ status: "PROCESSING" });
    await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SHIPPED", trackingNumber: "TRACK999", courier: "FedEx" });

    const customerNotifsAfterShip = await request(app).get("/api/notifications").set("Authorization", `Bearer ${customerToken}`);
    const shipped = customerNotifsAfterShip.body.data.items.find((n: { type: string }) => n.type === "ORDER_SHIPPED");
    expect(shipped).toBeDefined();
    expect(shipped.message).toContain("TRACK999");

    // Unread count and mark-all-read round-trip.
    const unreadBefore = await request(app).get("/api/notifications/unread-count").set("Authorization", `Bearer ${customerToken}`);
    expect(unreadBefore.body.data.count).toBeGreaterThan(0);

    await request(app).patch("/api/notifications/read-all").set("Authorization", `Bearer ${customerToken}`);
    const unreadAfter = await request(app).get("/api/notifications/unread-count").set("Authorization", `Bearer ${customerToken}`);
    expect(unreadAfter.body.data.count).toBe(0);
  });

  it("notifies admins when a customer cancels their own order", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "cancel-admin@test.local" });
    const adminToken = await loginAs("cancel-admin@test.local", adminPassword);

    const { password: customerPassword } = await createTestUser({ role: Role.CUSTOMER, email: "cancel-customer@test.local" });
    const customerToken = await loginAs("cancel-customer@test.local", customerPassword);

    const { variant } = await createTestProduct({ basePrice: 15, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${customerToken}`).send({ variantId: variant.id, quantity: 1 });

    const checkout = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: "Cancel Tester",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
      });
    const orderId = checkout.body.data.orderId;

    const cancel = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ reason: "Changed my mind" });
    expect(cancel.status).toBe(200);
    // A paid order that gets cancelled must stop counting as held revenue -
    // restocking reverses the sale, so the payment record has to follow.
    expect(cancel.body.data.paymentStatus).toBe("REFUNDED");

    const adminNotifs = await request(app).get("/api/notifications").set("Authorization", `Bearer ${adminToken}`);
    const cancelNotif = adminNotifs.body.data.items.find((n: { type: string }) => n.type === "ORDER_CANCELLED");
    expect(cancelNotif).toBeDefined();
    expect(cancelNotif.message).toContain("Changed my mind");
  });
});

describe("dashboard revenue reconciliation", () => {
  it("drops a cancelled order out of gross revenue instead of counting it forever", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "revenue-admin@test.local" });
    const adminToken = await loginAs("revenue-admin@test.local", adminPassword);

    const { password: customerPassword } = await createTestUser({ role: Role.CUSTOMER, email: "revenue-customer@test.local" });
    const customerToken = await loginAs("revenue-customer@test.local", customerPassword);

    const { variant } = await createTestProduct({ basePrice: 40, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${customerToken}`).send({ variantId: variant.id, quantity: 1 });

    const checkout = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: "Revenue Tester",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
      });
    const orderId = checkout.body.data.orderId;
    const placedOrder = await request(app).get(`/api/orders/${orderId}`).set("Authorization", `Bearer ${customerToken}`);
    const orderTotal = Number(placedOrder.body.data.grandTotal);

    const beforeCancel = await request(app).get("/api/admin/dashboard").set("Authorization", `Bearer ${adminToken}`);
    const grossBefore = beforeCancel.body.data.totalRevenue;
    const pendingBefore = beforeCancel.body.data.pendingRevenue;

    await request(app).post(`/api/orders/${orderId}/cancel`).set("Authorization", `Bearer ${customerToken}`).send({ reason: "test" });

    const afterCancel = await request(app).get("/api/admin/dashboard").set("Authorization", `Bearer ${adminToken}`);
    // Gross and pending must both fall by exactly the cancelled order's total -
    // this is the exact bug a manual pass caught: paymentStatus staying PAID
    // after a cancellation let a reversed sale inflate revenue forever.
    expect(afterCancel.body.data.totalRevenue).toBeCloseTo(grossBefore - orderTotal, 5);
    expect(afterCancel.body.data.pendingRevenue).toBeCloseTo(pendingBefore - orderTotal, 5);
    expect(afterCancel.body.data.refundedAmount).toBeGreaterThanOrEqual(orderTotal);
    // Gross must always reconcile to confirmed + pending, since REFUNDED
    // orders are excluded from both.
    expect(afterCancel.body.data.totalRevenue).toBeCloseTo(afterCancel.body.data.confirmedRevenue + afterCancel.body.data.pendingRevenue, 5);
  });
});
