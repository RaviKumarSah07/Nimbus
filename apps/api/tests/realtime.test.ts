import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import http from "node:http";
import type { AddressInfo } from "node:net";
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

async function startServer() {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return { server, port };
}

/** Minimal SSE client for tests: streams the response body and yields parsed "data:" frames one at a time, ignoring comment/keepalive/retry lines. */
class SseClient {
  statusCode: number | undefined;
  private buffer = "";
  private queue: { tags?: string[] }[] = [];
  private pending: { resolve: (v: { tags?: string[] }) => void } | null = null;
  private req: http.ClientRequest;

  constructor(url: string) {
    this.req = http.get(url, (res) => {
      this.statusCode = res.statusCode;
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => this.onChunk(chunk));
    });
    this.req.on("error", () => {
      // Surfaced via waitForMessage/waitForStatus timing out instead.
    });
  }

  private onChunk(chunk: string) {
    this.buffer += chunk;
    let idx: number;
    while ((idx = this.buffer.indexOf("\n\n")) !== -1) {
      const frame = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const parsed = JSON.parse(dataLine.slice("data: ".length)) as { tags?: string[] };
      if (this.pending) {
        this.pending.resolve(parsed);
        this.pending = null;
      } else {
        this.queue.push(parsed);
      }
    }
  }

  waitForMessage(timeoutMs = 3000): Promise<{ tags?: string[] }> {
    const queued = this.queue.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for an SSE message")), timeoutMs);
      this.pending = { resolve: (v) => { clearTimeout(timer); resolve(v); } };
    });
  }

  async waitForStatus(timeoutMs = 3000): Promise<number> {
    const start = Date.now();
    while (this.statusCode === undefined) {
      if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for a response status");
      await new Promise((r) => setTimeout(r, 20));
    }
    return this.statusCode;
  }

  close() {
    this.req.destroy();
  }
}

describe("realtime SSE endpoint", () => {
  let server: Awaited<ReturnType<typeof startServer>>["server"];
  let port: number;

  beforeEach(async () => {
    ({ server, port } = await startServer());
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("rejects a connection with no token", async () => {
    const client = new SseClient(`http://localhost:${port}/api/events`);
    expect(await client.waitForStatus()).toBe(401);
    client.close();
  });

  it("rejects a connection with an invalid token", async () => {
    const client = new SseClient(`http://localhost:${port}/api/events?token=not-a-real-token`);
    expect(await client.waitForStatus()).toBe(401);
    client.close();
  });

  it("accepts a connection with a valid token and pushes a tag invalidation when that customer's order is paid", async () => {
    const { password } = await createTestUser({ email: "realtime-customer@test.local" });
    const token = await loginAs("realtime-customer@test.local", password);

    const client = new SseClient(`http://localhost:${port}/api/events?token=${token}`);
    expect(await client.waitForStatus()).toBe(200);

    const { variant } = await createTestProduct({ basePrice: 15, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });

    const messagePromise = client.waitForMessage();
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

    client.close();
  });

  it("pushes to a connected admin when any order is placed, not to an unrelated customer", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "realtime-admin@test.local" });
    const adminToken = await loginAs("realtime-admin@test.local", adminPassword);

    const { password: bystanderPassword } = await createTestUser({ email: "realtime-bystander@test.local" });
    const bystanderToken = await loginAs("realtime-bystander@test.local", bystanderPassword);

    const adminClient = new SseClient(`http://localhost:${port}/api/events?token=${adminToken}`);
    const bystanderClient = new SseClient(`http://localhost:${port}/api/events?token=${bystanderToken}`);
    expect(await adminClient.waitForStatus()).toBe(200);
    expect(await bystanderClient.waitForStatus()).toBe(200);

    const { password: buyerPassword } = await createTestUser({ email: "realtime-buyer@test.local" });
    const buyerToken = await loginAs("realtime-buyer@test.local", buyerPassword);
    const { variant } = await createTestProduct({ basePrice: 15, stock: 5 });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${buyerToken}`).send({ variantId: variant.id, quantity: 1 });

    const adminMessagePromise = adminClient.waitForMessage();
    // Two-argument then() (not a separate .catch()) so the expected timeout
    // rejection is handled synchronously with the promise itself - an
    // unhandled rejection here was destabilizing the whole test run rather
    // than just failing this one assertion.
    const bystanderGotMessage = bystanderClient.waitForMessage(500).then(
      () => true,
      () => false,
    );

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
    expect(await bystanderGotMessage).toBe(false);

    adminClient.close();
    bystanderClient.close();
  });
});
