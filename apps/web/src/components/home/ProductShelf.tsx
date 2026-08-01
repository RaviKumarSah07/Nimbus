import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "../product/ProductCard";
import type { ProductSummary } from "../../lib/types";

export function ProductShelf({ title, viewAllHref, products }: { title: string; viewAllHref: string; products: ProductSummary[] }) {
  if (products.length === 0) return null;

  const headingId = `shelf-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className="rounded-md bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 id={headingId} className="text-lg font-bold text-slate-900 sm:text-xl">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="flex shrink-0 items-center gap-1 rounded-md border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Below lg this is a snap-scrolling rail rather than a grid: it keeps
          each shelf to one screen-height so the homepage stays browsable on a
          phone instead of turning into one very long column of cards. */}
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {products.map((product) => (
          <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48 lg:w-auto lg:shrink">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
