import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Badge } from "../ui/Badge";
import { StarRating } from "../ui/StarRating";
import { formatCurrency, formatDiscountPercent } from "../../lib/formatCurrency";
import type { ProductSummary } from "../../lib/types";

/**
 * Picks the genuinely deepest discount in the catalogue rather than hardcoding
 * a "deal" - if nothing is actually reduced, the section removes itself
 * instead of advertising a saving that doesn't exist.
 */
function pickBestDeal(products: ProductSummary[]): { product: ProductSummary; discount: number } | null {
  let best: { product: ProductSummary; discount: number } | null = null;

  for (const product of products) {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) continue;
    const discount = formatDiscountPercent(product.price, product.compareAtPrice);
    if (!best || discount > best.discount) best = { product, discount };
  }

  return best;
}

export function DealOfTheDay({ products }: { products: ProductSummary[] }) {
  const deal = pickBestDeal(products);
  if (!deal) return null;

  const { product, discount } = deal;
  const saving = (product.compareAtPrice ?? product.price) - product.price;

  return (
    <section aria-labelledby="deal-of-the-day" className="overflow-hidden rounded-md bg-white shadow-card">
      <div className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-2.5 sm:px-6">
        <Zap className="h-4 w-4 text-accent-300" aria-hidden="true" />
        <h2 id="deal-of-the-day" className="text-sm font-bold uppercase tracking-wide text-white">
          Deal of the day
        </h2>
        <span className="ml-auto text-xs font-medium text-brand-100">Biggest saving in the store right now</span>
      </div>

      <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Link
          href={`/product/${product.slug}`}
          className="relative aspect-square overflow-hidden rounded-lg bg-slate-50 transition-transform hover:scale-[1.01]"
        >
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 90vw"
              className="object-contain p-6"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
          )}
          <Badge tone="danger" className="absolute left-3 top-3">
            -{discount}%
          </Badge>
        </Link>

        <div className="flex flex-col justify-center gap-3">
          {product.brand && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{product.brand.name}</p>}

          <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            <Link href={`/product/${product.slug}`} className="hover:text-brand-700">
              {product.name}
            </Link>
          </h3>

          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.avgRating} size={16} />
              <span className="text-sm text-slate-500">
                {product.avgRating.toFixed(1)} ({product.ratingCount})
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-slate-900">{formatCurrency(product.price, product.currency)}</span>
            <span className="text-lg text-slate-400 line-through">{formatCurrency(product.compareAtPrice!, product.currency)}</span>
            <span className="text-base font-semibold text-emerald-700">Save {formatCurrency(saving, product.currency)}</span>
          </div>

          <p className="text-sm text-slate-500">
            {product.inStock ? "In stock and ready to ship." : "Currently out of stock."}
          </p>

          <Link
            href={`/product/${product.slug}`}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-md bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent-600"
          >
            View deal <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
