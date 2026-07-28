"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../lib/formatCurrency";
import { useAddCartItemMutation } from "../../store/api/cartApi";
import type { ProductDetail } from "../../lib/types";

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const sizes = useMemo(() => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[], [product.variants]);
  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[], [product.variants]);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [addCartItem, { isLoading }] = useAddCartItemMutation();
  const [justAdded, setJustAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVariant =
    product.variants.find((v) => (!sizes.length || v.size === selectedSize) && (!colors.length || v.color === selectedColor)) ??
    product.variants[0];

  const price = selectedVariant.priceOverride ?? product.basePrice;
  const inStock = selectedVariant.stock > 0;

  async function handleAddToCart() {
    setErrorMessage(null);
    setJustAdded(false);
    try {
      await addCartItem({ variantId: selectedVariant.id, quantity }).unwrap();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);
    } catch (err) {
      const message = (err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "Could not add to cart";
      setErrorMessage(message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-slate-900">{formatCurrency(price, product.currency)}</span>
        {product.compareAtPrice && (
          <span className="text-lg text-slate-400 line-through">{formatCurrency(product.compareAtPrice, product.currency)}</span>
        )}
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                aria-pressed={selectedColor === color}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  selectedColor === color ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                aria-pressed={selectedSize === size}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  selectedSize === size ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm">
        {inStock ? (
          <span className="text-emerald-600">{selectedVariant.stock <= 5 ? `Only ${selectedVariant.stock} left` : "In stock"}</span>
        ) : (
          <span className="text-red-600">Out of stock</span>
        )}
      </p>

      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
          Qty
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!inStock}
          className="h-10 rounded-lg border border-slate-300 px-2 text-sm"
        >
          {Array.from({ length: Math.min(selectedVariant.stock, 10) || 1 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <Button onClick={handleAddToCart} disabled={!inStock} isLoading={isLoading} className="flex-1">
          {justAdded ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
          {justAdded ? "Added" : "Add to cart"}
        </Button>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      {justAdded && (
        <p className="text-sm text-emerald-600">
          Added to your cart. <Link href="/cart" className="underline">View cart</Link>
        </p>
      )}
    </div>
  );
}
