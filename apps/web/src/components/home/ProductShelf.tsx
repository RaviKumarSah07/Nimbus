import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "../product/ProductCard";
import type { ProductSummary } from "../../lib/types";

export function ProductShelf({ title, viewAllHref, products }: { title: string; viewAllHref: string; products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={`shelf-${title}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id={`shelf-${title}`} className="text-xl font-semibold text-slate-900">
          {title}
        </h2>
        <Link href={viewAllHref} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
