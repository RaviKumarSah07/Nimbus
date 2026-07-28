import Image from "next/image";
import Link from "next/link";
import { Badge } from "../ui/Badge";
import { StarRating } from "../ui/StarRating";
import { WishlistButton } from "./WishlistButton";
import { formatCurrency, formatDiscountPercent } from "../../lib/formatCurrency";
import type { ProductSummary } from "../../lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
  const discount = product.compareAtPrice ? formatDiscountPercent(product.price, product.compareAtPrice) : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.altText ?? product.name}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.brand.name}</span>}
        <h3 className="line-clamp-2 text-sm font-medium text-slate-900">{product.name}</h3>
        <StarRating rating={product.avgRating} size={14} />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-slate-900">{formatCurrency(product.price, product.currency)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice, product.currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
