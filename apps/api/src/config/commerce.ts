/** Centralized business rules for order totals - the "why" a receipt looks the way it does. */
export const COMMERCE_RULES = {
  FLAT_SHIPPING_RATE: 9.99,
  FREE_SHIPPING_THRESHOLD: 75,
  // Flat-rate tax for demo purposes; a real store would look this up per
  // shipping jurisdiction via a tax service (Avalara, TaxJar, etc).
  TAX_RATE: 0.08,
} as const;

export function calculateShipping(subtotal: number): number {
  return subtotal >= COMMERCE_RULES.FREE_SHIPPING_THRESHOLD ? 0 : COMMERCE_RULES.FLAT_SHIPPING_RATE;
}

export function calculateTax(taxableAmount: number): number {
  return Math.round(taxableAmount * COMMERCE_RULES.TAX_RATE * 100) / 100;
}
