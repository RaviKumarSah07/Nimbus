"use client";

import Image from "next/image";
import Link from "next/link";
import { X, AlertTriangle } from "lucide-react";
import { QuantityStepper } from "./QuantityStepper";
import { formatCurrency } from "../../lib/formatCurrency";
import { useUpdateCartItemMutation, useRemoveCartItemMutation } from "../../store/api/cartApi";
import type { CartItemDto } from "../../lib/types-cart";

export function CartLineItem({ item }: { item: CartItemDto }) {
  const [updateItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const isMutating = isUpdating || isRemoving;

  const variantLabel = [item.color, item.size].filter(Boolean).join(" / ");
  const overStock = item.quantity > item.availableStock;

  return (
    <li className="flex gap-4 border-b border-slate-100 py-4 last:border-none">
      <Link href={`/product/${item.productSlug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.image && <Image src={item.image} alt={item.productName} fill sizes="96px" className="object-cover" />}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/product/${item.productSlug}`} className="text-sm font-medium text-slate-900 hover:underline">
              {item.productName}
            </Link>
            {variantLabel && <p className="text-xs text-slate-500">{variantLabel}</p>}
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            disabled={isMutating}
            aria-label={`Remove ${item.productName} from cart`}
            className="text-slate-400 hover:text-red-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {item.priceChanged && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Price updated to match the current listing.
          </p>
        )}
        {overStock && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Only {item.availableStock} left - reduce quantity.
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper
            quantity={item.quantity}
            max={Math.max(item.availableStock, 1)}
            disabled={isMutating}
            onChange={(next) => updateItem({ itemId: item.id, quantity: next })}
          />
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
            <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice)} each</p>
          </div>
        </div>
      </div>
    </li>
  );
}
