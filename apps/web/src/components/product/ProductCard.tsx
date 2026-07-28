import Image from "next/image";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Badge } from "../ui/Badge";
import { RatingBadge } from "../ui/RatingBadge";
import { WishlistButton } from "./WishlistButton";
import { formatCurrency, formatDiscountPercent } from "../../lib/formatCurrency";
import type { ProductSummary } from "../../lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
  const discount = product.compareAtPrice ? formatDiscountPercent(product.price, product.compareAtPrice) : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-transparent bg-white transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-card-hover"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.altText ?? product.name}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 45vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount && discount > 0 && <Badge tone="danger">-{discount}%</Badge>}
          {!product.inStock && <Badge tone="neutral">Out of stock</Badge>}
        </div>
        <WishlistButton productId={product.id} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.brand.name}</span>}
        <h3 className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</h3>
        <RatingBadge rating={product.avgRating} count={product.ratingCount || undefined} />
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-slate-900">{formatCurrency(product.price, product.currency)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice, product.currency)}</span>
          )}
          {discount && discount > 0 && <span className="text-sm font-medium text-emerald-700">{discount}% off</span>}
        </div>
        {product.inStock && (
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-slate-500">
            <Truck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Free delivery
          </p>
        )}
      </div>
    </Link>
  );
}
