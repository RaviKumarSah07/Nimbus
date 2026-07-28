import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "../product/ProductCard";
import type { ProductSummary } from "../../lib/types";

export function ProductShelf({ title, viewAllHref, products }: { title: string; viewAllHref: string; products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={`shelf-${title}`} className="rounded-md bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 id={`shelf-${title}`} className="text-lg font-bold text-slate-900 sm:text-xl">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 rounded-md border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
