import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { resetDatabase } from "./helpers/db";
import { createTestProduct } from "./helpers/fixtures";

const app = createApp();
const GUEST_TOKEN_HEADER = "x-guest-cart-token";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("cart", () => {
  it("computes subtotal and item count correctly as items are added", async () => {
    const { variant } = await createTestProduct({ basePrice: 19.99, stock: 10 });
    const guestToken = "guest-cart-test-1";

    const add = await request(app)
      .post("/api/cart/items")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ variantId: variant.id, quantity: 3 });

    expect(add.status).toBe(201);
    expect(add.body.data.itemCount).toBe(3);
    expect(add.body.data.subtotal).toBeCloseTo(59.97, 2);

    const get = await request(app).get("/api/cart").set(GUEST_TOKEN_HEADER, guestToken);
    expect(get.body.data.itemCount).toBe(3);
    expect(get.body.data.items).toHaveLength(1);
  });

  it("rejects adding more than the available stock", async () => {
    const { variant } = await createTestProduct({ basePrice: 10, stock: 2 });
    const guestToken = "guest-cart-test-2";

    const res = await request(app)
      .post("/api/cart/items")
      .set(GUEST_TOKEN_HEADER, guestToken)
      .send({ variantId: variant.id, quantity: 5 });

    expect(res.status).toBe(409);
  });

  it("keeps guest carts isolated by token", async () => {
    const { variant } = await createTestProduct({ basePrice: 10, stock: 10 });

    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, "guest-a").send({ variantId: variant.id, quantity: 1 });

    const cartB = await request(app).get("/api/cart").set(GUEST_TOKEN_HEADER, "guest-b");
    expect(cartB.body.data.itemCount).toBe(0);
  });

  it("merges a guest cart into a user's cart on request and deletes the guest cart", async () => {
    const { variant } = await createTestProduct({ basePrice: 15, stock: 10 });
    const guestToken = "guest-cart-merge-test";

    await request(app).post("/api/cart/items").set(GUEST_TOKEN_HEADER, guestToken).send({ variantId: variant.id, quantity: 2 });

    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Cart Merger", email: "cart-merger@example.com", password: "Passw0rd!" });
    const token = register.body.data.accessToken;

    const merge = await request(app)
      .post("/api/cart/merge")
      .set("Authorization", `Bearer ${token}`)
      .send({ guestToken });
    expect(merge.status).toBe(200);
    expect(merge.body.data.itemCount).toBe(2);

    const guestCartAfter = await request(app).get("/api/cart").set(GUEST_TOKEN_HEADER, guestToken);
    expect(guestCartAfter.body.data.itemCount).toBe(0);
  });
});
