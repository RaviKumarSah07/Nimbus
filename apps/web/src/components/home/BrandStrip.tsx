import Link from "next/link";
import type { BrandSummary } from "../../lib/types";

/** Brand shortcuts, driven by the brands that actually exist in the catalogue. */
export function BrandStrip({ brands }: { brands: BrandSummary[] }) {
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="top-brands" className="rounded-md bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 id="top-brands" className="text-lg font-bold text-slate-900 sm:text-xl">
          Shop by brand
        </h2>
        <Link href="/products" className="text-sm font-semibold text-brand-600 hover:underline">
          Browse all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/products?brand=${brand.slug}`}
            className="flex h-16 items-center justify-center rounded-lg border border-slate-200 px-3 text-center text-sm font-bold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
