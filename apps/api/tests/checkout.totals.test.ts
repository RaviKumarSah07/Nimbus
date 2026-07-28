import { describe, it, expect } from "vitest";
import { computeOrderTotals } from "../src/modules/orders/order.service";

describe("computeOrderTotals (pure business logic - no client-supplied price is ever trusted here)", () => {
  it("applies free shipping above the threshold and no discount", () => {
    const totals = computeOrderTotals(100, 0);
    expect(totals.subtotal).toBe(100);
    expect(totals.discountTotal).toBe(0);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.taxTotal).toBeCloseTo(8, 2); // 8% of 100
    expect(totals.grandTotal).toBeCloseTo(108, 2);
  });

  it("charges flat shipping below the free-shipping threshold", () => {
    const totals = computeOrderTotals(50, 0);
    expect(totals.shippingTotal).toBeCloseTo(9.99, 2);
    expect(totals.taxTotal).toBeCloseTo(4, 2); // 8% of 50
    expect(totals.grandTotal).toBeCloseTo(50 + 9.99 + 4, 2);
  });

  it("taxes the post-discount amount, not the pre-discount subtotal", () => {
    const totals = computeOrderTotals(100, 20);
    expect(totals.discountTotal).toBe(20);
    expect(totals.taxTotal).toBeCloseTo(6.4, 2); // 8% of (100 - 20)
    expect(totals.grandTotal).toBeCloseTo(100 - 20 + 0 + 6.4, 2);
  });

  it("never lets the discount exceed the subtotal", () => {
    const totals = computeOrderTotals(30, 999);
    expect(totals.discountTotal).toBe(30);
    expect(totals.grandTotal).toBeGreaterThanOrEqual(totals.shippingTotal);
  });
});
