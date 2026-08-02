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

describe("admin review moderation", () => {
  it("rejects anonymous and customer requests, accepts admin requests", async () => {
    const { password: customerPassword } = await createTestUser({ email: "review-customer@test.local" });
    const customerToken = await loginAs("review-customer@test.local", customerPassword);
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "review-admin@test.local" });
    const adminToken = await loginAs("review-admin@test.local", adminPassword);

    const anonymous = await request(app).get("/api/admin/reviews");
    expect(anonymous.status).toBe(401);

    const asCustomer = await request(app).get("/api/admin/reviews").set("Authorization", `Bearer ${customerToken}`);
    expect(asCustomer.status).toBe(403);

    const asAdmin = await request(app).get("/api/admin/reviews").set("Authorization", `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);
  });

  it("lists, searches, and filters reviews across products and customers", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "review-list-admin@test.local" });
    const adminToken = await loginAs("review-list-admin@test.local", adminPassword);

    const { password: aliceP } = await createTestUser({ email: "alice-reviewer@test.local" });
    const aliceToken = await loginAs("alice-reviewer@test.local", aliceP);
    const { password: bobP } = await createTestUser({ email: "bob-reviewer@test.local" });
    const bobToken = await loginAs("bob-reviewer@test.local", bobP);

    const { product: laptop } = await createTestProduct({ name: "AeroBook Pro Laptop" });
    const { product: shirt } = await createTestProduct({ name: "Classic Oxford Shirt" });

    await request(app)
      .post(`/api/reviews/product/${laptop.id}`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ rating: 5, title: "Excellent machine", body: "Fast and reliable for daily work." });
    await request(app)
      .post(`/api/reviews/product/${shirt.id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ rating: 2, title: "Disappointing fit", body: "Ran smaller than expected." });

    const all = await request(app).get("/api/admin/reviews").set("Authorization", `Bearer ${adminToken}`);
    expect(all.body.data.meta.total).toBe(2);

    const byRating = await request(app).get("/api/admin/reviews").query({ rating: 5 }).set("Authorization", `Bearer ${adminToken}`);
    expect(byRating.body.data.items).toHaveLength(1);
    expect(byRating.body.data.items[0].title).toBe("Excellent machine");

    const byProductSearch = await request(app).get("/api/admin/reviews").query({ q: "AeroBook" }).set("Authorization", `Bearer ${adminToken}`);
    expect(byProductSearch.body.data.items).toHaveLength(1);
    expect(byProductSearch.body.data.items[0].product.name).toBe("AeroBook Pro Laptop");

    const byReviewTextSearch = await request(app).get("/api/admin/reviews").query({ q: "disappointing" }).set("Authorization", `Bearer ${adminToken}`);
    expect(byReviewTextSearch.body.data.items).toHaveLength(1);
    expect(byReviewTextSearch.body.data.items[0].user.email).toBe("bob-reviewer@test.local");
  });

  it("deleting a review removes it and recomputes the product's rating aggregate", async () => {
    const { password: adminPassword } = await createTestUser({ role: Role.ADMIN, email: "review-delete-admin@test.local" });
    const adminToken = await loginAs("review-delete-admin@test.local", adminPassword);
    const { password: reviewerPassword } = await createTestUser({ email: "review-deleter-target@test.local" });
    const reviewerToken = await loginAs("review-deleter-target@test.local", reviewerPassword);

    const { product } = await createTestProduct({ name: "Moderation Test Product" });
    const created = await request(app)
      .post(`/api/reviews/product/${product.id}`)
      .set("Authorization", `Bearer ${reviewerToken}`)
      .send({ rating: 1, title: "Inappropriate content", body: "This review violates guidelines." });
    const reviewId = created.body.data.id;

    const afterReview = await request(app).get(`/api/products/${product.slug}`);
    expect(afterReview.body.data.ratingCount).toBe(1);
    expect(afterReview.body.data.avgRating).toBe(1);

    const deleted = await request(app).delete(`/api/admin/reviews/${reviewId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);

    const list = await request(app).get("/api/admin/reviews").set("Authorization", `Bearer ${adminToken}`);
    expect(list.body.data.meta.total).toBe(0);

    const afterDelete = await request(app).get(`/api/products/${product.slug}`);
    expect(afterDelete.body.data.ratingCount).toBe(0);
    expect(afterDelete.body.data.avgRating).toBe(0);
  });
});
