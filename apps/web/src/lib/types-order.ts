import type { OrderStatus, PaymentStatus, ReturnStatus } from "@ecommerce/shared";

export interface OrderItemDto {
  id: string;
  productId: string | null;
  variantId: string | null;
  nameSnapshot: string;
  variantSnapshot: string | null;
  priceSnapshot: string;
  quantity: number;
  imageSnapshot: string | null;
}

export interface OrderStatusHistoryDto {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface ReturnRequestDto {
  id: string;
  orderItemId: string;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  guestEmail: string | null;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  trackingNumber: string | null;
  courier: string | null;
  createdAt: string;
  placedAt: string | null;
  items: OrderItemDto[];
  statusHistory?: OrderStatusHistoryDto[];
  returnRequests?: ReturnRequestDto[];
}
