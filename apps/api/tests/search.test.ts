import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { resetDatabase } from "./helpers/db";
import { createTestProduct } from "./helpers/fixtures";

const app = createApp();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("product search fallback", () => {
  it("matches on a literal substring in the product's own name", async () => {
    await createTestProduct({ name: "Wireless Bluetooth Headphones" });

    const res = await request(app).get("/api/products").query({ q: "headphones" });
    expect(res.status).toBe(200);
    expect(res.body.data.matchType).toBe("exact");
    expect(res.body.data.items).toHaveLength(1);
  });

  it("matches by category or brand name even when the word never appears on the product itself", async () => {
    await createTestProduct({ name: "Nordic Oak Coffee Table", categoryName: "Electronics" });

    // "Nordic Oak Coffee Table" contains none of "electronics" - only the
    // category relation does. Broadening the OR to include it is what makes
    // this findable at all.
    const res = await request(app).get("/api/products").query({ q: "electronics" });
    expect(res.status).toBe(200);
    expect(res.body.data.matchType).toBe("exact");
    expect(res.body.data.items).toHaveLength(1);
  });

  it("falls back to a fuzzy typo-tolerant match when nothing matches exactly", async () => {
    await createTestProduct({ name: "AeroBook Pro Laptop" });

    const res = await request(app).get("/api/products").query({ q: "aerobok" }); // missing the second "o"
    expect(res.status).toBe(200);
    expect(res.body.data.matchType).toBe("fuzzy");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe("AeroBook Pro Laptop");
  });

  it("falls back to popular products when the query has no plausible match at all", async () => {
    await createTestProduct({ name: "AeroBook Pro Laptop" });

    const res = await request(app).get("/api/products").query({ q: "zzzzzzxyqwerty12345nonsense" });
    expect(res.status).toBe(200);
    expect(res.body.data.matchType).toBe("suggested");
    // Nothing else in the catalog to suggest besides the one seeded product,
    // but the point is it's returned instead of an empty grid.
    expect(res.body.data.items).toHaveLength(1);
  });

  it("keeps a nonsense query's suggested fallback scoped to an active category filter", async () => {
    await createTestProduct({ name: "AeroBook Pro Laptop", categoryName: "Laptops" });
    await createTestProduct({ name: "Classic Oxford Shirt", categoryName: "Fashion" });

    // A nonsense query scoped to Fashion must not suggest the Laptops product -
    // the category filter is a deliberate user choice, not part of the fuzzy
    // text-matching problem the fallback is meant to solve.
    const fashionCategory = await prisma.category.findFirstOrThrow({ where: { name: "Fashion" } });
    const res = await request(app).get("/api/products").query({ q: "zzzzzzxyqwerty12345nonsense", category: fashionCategory.slug });
    expect(res.status).toBe(200);
    expect(res.body.data.matchType).toBe("suggested");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe("Classic Oxford Shirt");
  });
});
