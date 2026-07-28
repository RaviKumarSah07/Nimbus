export interface CartItemDto {
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

export interface CartDto {
  id: string | null;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
}
