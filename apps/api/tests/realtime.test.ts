import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import { WebSocket } from "ws";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { attachRealtimeServer } from "../src/lib/realtime";
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

/** Realtime needs a real bound socket to upgrade - supertest's ephemeral per-request server won't do. */
async function startRealtimeServer() {
  const server = app.listen(0);
  attachRealtimeServer(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return { server, port };
}

function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<{ tags?: string[] }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for a WebSocket message")), timeoutMs);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
    ws.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function waitForOpenOrClose(ws: WebSocket): Promise<"open" | "close"> {
  return new Promise((resolve) => {
    ws.once("open", () => resolve("open"));
    ws.once("close", () => resolve("close"));
    ws.once("error", () => resolve("close"));
  });
}

describe("realtime WebSocket server", () => {
  let server: Awaited<ReturnType<typeof startRealtimeServer>>["server"];
  let port: number;

  beforeEach(async () => {
    ({ server, port } = await startRealtimeServer());
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("rejects a connection with no token", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/api/ws`);
    const outcome = await waitForOpenOrClose(ws);
    expect(outcome).toBe("close");
  });

  it("rejects a connection with an invalid token", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/api/ws?token=not-a-real-token`);
    const outcome = await waitForOpenOrClose(ws);
    expect(outcome).toBe("close");
  });

  it("rejects a connection from a disallowed origin", async () => {
    const { password } = await createTestUser({ email: "origin-test@test.local" });
    const token = await loginAs("origin-test@test.local", password);
    const ws = new WebSocket(`ws://localhost:${port}/api/ws?token=${token}`, { origin: "https://evil.example.com" });
    const outcome = await waitForOpenOrClose(ws);
    expect(outcome).toBe("close");
  });

  it("accepts a connection with a valid token and pushes a tag invalidation when that customer's order is paid", async () => {
    const { password } = await createTestUser({ email: "realtime-customer@test.local" });
    const token = await loginAs("realtime-customer@test.local", password);

    const ws = new WebSocket(`ws://localhost:${port}/api/ws?token=${token}`);
    const outcome = await waitForOpenOrClose(ws);
    expect(outcome).toBe("open");

    const { variant } = await createTestProduct({ basePrice: 15, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });

    const messagePromise = waitForMessage(ws);
    await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Realtime Tester",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
      });

    const message = await messagePromise;
    expect(message.tags).toContain("Order");
    expect(message.tags).toContain("Cart");

    // The push must not win a race against the clear it's announcing - a
    // client that refetches the instant this message arrives has to see the
    // cart already empty, not the pre-checkout state.
    const cartAtMessageTime = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);
    expect(cartAtMessageTime.body.data.itemCount).toBe(0);

    ws.close();
  });

  it("pushes to a connected admin when any order is placed, not to an unrelated customer", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "realtime-admin@test.local" });
    const adminToken = await loginAs("realtime-admin@test.local", adminPassword);

    const { password: bystanderPassword } = await createTestUser({ email: "realtime-bystander@test.local" });
    const bystanderToken = await loginAs("realtime-bystander@test.local", bystanderPassword);

    const adminWs = new WebSocket(`ws://localhost:${port}/api/ws?token=${adminToken}`);
    const bystanderWs = new WebSocket(`ws://localhost:${port}/api/ws?token=${bystanderToken}`);
    await Promise.all([waitForOpenOrClose(adminWs), waitForOpenOrClose(bystanderWs)]);

    const { password: buyerPassword } = await createTestUser({ email: "realtime-buyer@test.local" });
    const buyerToken = await loginAs("realtime-buyer@test.local", buyerPassword);
    const { variant } = await createTestProduct({ basePrice: 15, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${buyerToken}`).send({ variantId: variant.id, quantity: 1 });

    const adminMessagePromise = waitForMessage(adminWs);
    let bystanderGotMessage = false;
    bystanderWs.once("message", () => {
      bystanderGotMessage = true;
    });

    await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        shippingAddress: {
          fullName: "Buyer",
          phone: "5551234567",
          line1: "1 Test Way",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
        },
      });

    const adminMessage = await adminMessagePromise;
    expect(adminMessage.tags).toContain("AdminOrder");
    expect(adminMessage.tags).toContain("AdminDashboard");
    expect(bystanderGotMessage).toBe(false);

    adminWs.close();
    bystanderWs.close();
  });
});
