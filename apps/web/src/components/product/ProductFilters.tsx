"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import { StarRating } from "../ui/StarRating";
import { Button } from "../ui/Button";
import type { BrandSummary, CategoryNode } from "../../lib/types";

export interface ProductFiltersProps {
  categories: CategoryNode[];
  brands: BrandSummary[];
}

/** Query keys this panel owns - used for counting and clearing active filters. */
export const FILTER_PARAM_KEYS = ["category", "brand", "minPrice", "maxPrice", "minRating", "inStock", "onSale"] as const;

export function countActiveFilters(searchParams: URLSearchParams) {
  return FILTER_PARAM_KEYS.filter((key) => searchParams.get(key)).length;
}

/**
 * The filter controls themselves, with no layout chrome. Rendered as a
 * sidebar on desktop and inside a bottom sheet on mobile, so both surfaces
 * stay in sync from one definition.
 */
export function ProductFilterControls({ categories, brands }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeMinRating = searchParams.get("minRating");
  const inStockOnly = searchParams.get("inStock") === "true";
  const onSaleOnly = searchParams.get("onSale") === "true";

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleParam(key: string, value: string) {
    pushParams((params) => {
      if (params.get(key) === value) params.delete(key);
      else params.set(key, value);
    });
  }

  function handlePriceSubmit(e: FormEvent) {
    e.preventDefault();
    pushParams((params) => {
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
    });
  }

  const flatCategories = categories.flatMap((c) => [c, ...c.children]);

  return (
    <div className="flex flex-col gap-6">
      <FilterGroup title="Category">
        <div className="flex flex-col gap-1">
          {flatCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleParam("category", category.slug)}
              aria-pressed={activeCategory === category.slug}
              className={clsx(
                "rounded-md px-2 py-2 text-left text-sm lg:py-1.5",
                activeCategory === category.slug ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          <div className="flex flex-col gap-1">
            {brands.map((brand) => (
              <label key={brand.id} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-50 lg:py-1.5">
                <input
                  type="checkbox"
                  checked={activeBrand === brand.slug}
                  onChange={() => toggleParam("brand", brand.slug)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {brand.name}
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price range">
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 px-2 text-sm lg:h-9"
            aria-label="Minimum price"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 px-2 text-sm lg:h-9"
            aria-label="Maximum price"
          />
          <Button type="submit" size="sm" variant="outline">
            Go
          </Button>
        </form>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-col gap-1">
          {[4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => toggleParam("minRating", String(stars))}
              aria-pressed={activeMinRating === String(stars)}
              className={clsx(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm lg:py-1.5",
                activeMinRating === String(stars) ? "bg-brand-50" : "hover:bg-slate-50",
              )}
            >
              <StarRating rating={stars} size={14} />
              <span className="text-slate-600">& up</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="flex items-center gap-2 px-2 py-2 text-sm text-slate-600 lg:py-1.5">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => toggleParam("inStock", "true")}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          In stock only
        </label>
        <label className="flex items-center gap-2 px-2 py-2 text-sm text-slate-600 lg:py-1.5">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={() => toggleParam("onSale", "true")}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          On sale only
        </label>
      </FilterGroup>
    </div>
  );
}

/** Desktop sidebar. Mobile gets the same controls via MobileFilterBar. */
export function ProductFilters({ categories, brands }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 self-start rounded-md bg-white p-4 shadow-card lg:flex" aria-label="Product filters">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Filters</h2>
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-xs font-bold uppercase tracking-wide text-brand-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      <ProductFilterControls categories={categories} brands={brands} />
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-none first:pt-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}
