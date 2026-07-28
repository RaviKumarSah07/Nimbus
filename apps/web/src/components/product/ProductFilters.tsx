"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import { StarRating } from "../ui/StarRating";
import { Button } from "../ui/Button";
import type { BrandSummary, CategoryNode } from "../../lib/types";

interface ProductFiltersProps {
  categories: CategoryNode[];
  brands: BrandSummary[];
}

export function ProductFilters({ categories, brands }: ProductFiltersProps) {
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
    router.push(`${pathname}?${params.toString()}`);
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

  function clearAll() {
    router.push(pathname);
  }

  const flatCategories = categories.flatMap((c) => [c, ...c.children]);

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-64 lg:shrink-0" aria-label="Product filters">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={clearAll} className="text-xs font-medium text-brand-600 hover:underline">
          Clear all
        </button>
      </div>

      <FilterGroup title="Category">
        <div className="flex flex-col gap-1">
          {flatCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleParam("category", category.slug)}
              className={clsx(
                "rounded-md px-2 py-1.5 text-left text-sm",
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
              <label key={brand.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
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
            className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
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
            className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
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
              className={clsx(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
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
        <label className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => toggleParam("inStock", "true")}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          In stock only
        </label>
        <label className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={() => toggleParam("onSale", "true")}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          On sale only
        </label>
      </FilterGroup>
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
