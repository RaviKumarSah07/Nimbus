import { Layers, PackageCheck, Star, Store } from "lucide-react";
import type { ProductSummary } from "../../lib/types";

interface StorefrontStatsProps {
  totalProducts: number;
  categoryCount: number;
  brandCount: number;
  ratedProducts: ProductSummary[];
}

/**
 * Every figure here is computed from the live catalogue rather than written
 * into the markup, so the section can never drift into advertising numbers
 * the store doesn't actually have.
 */
export function StorefrontStats({ totalProducts, categoryCount, brandCount, ratedProducts }: StorefrontStatsProps) {
  const rated = ratedProducts.filter((p) => p.ratingCount > 0);
  const reviewCount = rated.reduce((sum, p) => sum + p.ratingCount, 0);
  const averageRating = reviewCount > 0 ? rated.reduce((sum, p) => sum + p.avgRating * p.ratingCount, 0) / reviewCount : 0;

  const stats = [
    { icon: PackageCheck, value: totalProducts.toLocaleString(), label: totalProducts === 1 ? "Product listed" : "Products listed" },
    { icon: Layers, value: categoryCount.toLocaleString(), label: "Categories" },
    { icon: Store, value: brandCount.toLocaleString(), label: "Brands stocked" },
    ...(reviewCount > 0
      ? [{ icon: Star, value: `${averageRating.toFixed(1)}/5`, label: `From ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}` }]
      : []),
  ];

  return (
    <section aria-label="Storefront at a glance" className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-slate-200 shadow-card sm:grid-cols-4">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 bg-white px-3 py-6 text-center">
          <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      ))}
    </section>
  );
}
