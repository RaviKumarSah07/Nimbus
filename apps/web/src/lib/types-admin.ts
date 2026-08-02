import type { CouponType, OrderStatus, PaymentStatus, Role } from "@ecommerce/shared";

export interface AdminCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  parentId: string | null;
}

export interface AdminBrandDto {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceOverride: string | null;
  stock: number;
}

export interface AdminProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface AdminProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category: AdminCategoryDto;
  brandId: string | null;
  brand: AdminBrandDto | null;
  basePrice: string;
  compareAtPrice: string | null;
  isFeatured: boolean;
  isActive: boolean;
  avgRating: string;
  ratingCount: number;
  variants: AdminProductVariantDto[];
  images: AdminProductImageDto[];
}

export interface DashboardStatsDto {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  refundedAmount: number;
  orderCountsByStatus: Partial<Record<OrderStatus, number>>;
  totalCustomers: number;
  lowStockVariants: { variantId: string; sku: string; stock: number; productName: string; productSlug: string }[];
  recentOrders: { id: string; orderNumber: string; status: OrderStatus; grandTotal: number; itemCount: number; createdAt: string }[];
  revenueSeries: { day: string; revenue: number; orders: number }[];
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
}

export interface AdminCouponDto {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  minSubtotal: string | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface AdminBannerDto {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  guestEmail: string | null;
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
  trackingNumber: string | null;
  courier: string | null;
  items: { id: string; nameSnapshot: string; quantity: number; priceSnapshot: string; imageSnapshot: string | null; variantSnapshot: string | null }[];
  statusHistory?: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
  returnRequests?: { id: string; orderItemId: string; reason: string; status: string }[];
  shippingAddress: Record<string, string>;
}

export interface AdminReviewDto {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
}
