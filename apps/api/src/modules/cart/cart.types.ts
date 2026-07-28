export interface CartIdentity {
  userId?: string;
  guestToken?: string;
}

export interface CartItemView {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  priceChanged: boolean;
}

export interface CartView {
  id: string | null;
  items: CartItemView[];
  subtotal: number;
  itemCount: number;
}
