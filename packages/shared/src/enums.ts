// Kept in sync by hand with packages/db/prisma/schema.prisma enums.
// Frontend never imports @ecommerce/db (that would leak Prisma into the
// browser bundle), so these string-literal unions are the shared contract.

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COUPON_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const PRODUCT_SORT_OPTIONS = ["newest", "price_asc", "price_desc", "rating", "popularity"] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

// Order statuses a customer is allowed to request a transition INTO
// (everything else is admin/system-only, e.g. PAID is set by the Stripe webhook).
export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "PAID"];
