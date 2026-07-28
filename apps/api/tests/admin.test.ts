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

    const toShipped = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SHIPPED" });
    expect(toShipped.status).toBe(200);
    expect(toShipped.body.data.status).toBe("SHIPPED");

    const toDelivered = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "DELIVERED" });
    expect(toDelivered.status).toBe(200);
  });
});
