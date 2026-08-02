// Kept in sync by hand with packages/db/prisma/schema.prisma enums.
// Frontend never imports @ecommerce/db (that would leak Prisma into the
// browser bundle), so these string-literal unions are the shared contract.

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// The one allowed-transitions table, imported by both the API (to enforce
// it) and the admin UI (to know which buttons to show) so the two can never
// drift into disagreeing about what move is legal.
//
// PAID is deliberately unreachable from here: this app has no Cash on
// Delivery, so the only ways money is ever actually confirmed are the
// Stripe webhook and the mock gateway's immediate-pay path (both call
// markOrderPaid directly, bypassing this table entirely). An admin-facing
// "mark as paid" button would let an order be treated as paid - stock
// decremented, revenue counted - without a real payment ever happening.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const NOTIFICATION_TYPES = [
  "ORDER_PLACED",
  "ORDER_PROCESSING",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COUPON_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const PRODUCT_SORT_OPTIONS = ["newest", "price_asc", "price_desc", "rating", "popularity"] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

// How a product listing's results relate to the search text, so the
// frontend can explain a result set instead of presenting a fuzzy or
// fallback match as if it were exactly what was typed.
// - exact: a real substring/word match on name, description, brand, or category
// - fuzzy: no exact match, but these are typo-distance-close by name (pg_trgm)
// - suggested: no match at any distance - these are just popular picks
export const PRODUCT_MATCH_TYPES = ["exact", "fuzzy", "suggested"] as const;
export type ProductMatchType = (typeof PRODUCT_MATCH_TYPES)[number];

// Order statuses a customer is allowed to request a transition INTO
// (everything else is admin/system-only, e.g. PAID is set by the Stripe webhook).
export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "PAID"];
