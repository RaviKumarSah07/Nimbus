import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { resetDatabase } from "./helpers/db";

const app = createApp();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth flows", () => {
  it("registers a new user and issues an access token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password: "Passw0rd!" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("ada@example.com");
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers["set-cookie"]?.[0]).toMatch(/refresh_token=/);
  });

  it("rejects registration with a weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Weak", email: "weak@example.com", password: "weak" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({ name: "First", email: "dup@example.com", password: "Passw0rd!" });
    const res = await request(app).post("/api/auth/register").send({ name: "Second", email: "dup@example.com", password: "Passw0rd!" });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials, and gives identical errors for wrong-password vs. no-such-account", async () => {
    await request(app).post("/api/auth/register").send({ name: "Grace Hopper", email: "grace@example.com", password: "Passw0rd!" });

    const good = await request(app).post("/api/auth/login").send({ email: "grace@example.com", password: "Passw0rd!" });
    expect(good.status).toBe(200);

    // Wrong password for a real account and a login for an account that
    // doesn't exist must be indistinguishable, or the endpoint leaks which
    // emails are registered.
    const wrongPassword = await request(app).post("/api/auth/login").send({ email: "grace@example.com", password: "WrongPass1" });
    const noSuchAccount = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "WrongPass1" });

    expect(wrongPassword.status).toBe(401);
    expect(noSuchAccount.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(noSuchAccount.body.error.message);
    expect(wrongPassword.body.error.message).toMatch(/invalid email or password/i);
  });

  it("rejects /me without a token and accepts it with one", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Margaret Hamilton", email: "margaret@example.com", password: "Passw0rd!" });
    const token = register.body.data.accessToken;

    const unauthenticated = await request(app).get("/api/auth/me");
    expect(unauthenticated.status).toBe(401);

    const authenticated = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.data.email).toBe("margaret@example.com");
  });

  it("rotates the refresh token and revokes it on logout", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ name: "Katherine Johnson", email: "katherine@example.com", password: "Passw0rd!" });

    const refreshed = await agent.post("/api/auth/refresh");
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));

    await agent.post("/api/auth/logout");
    const afterLogout = await agent.post("/api/auth/refresh");
    expect(afterLogout.status).toBe(401);
  });
});
