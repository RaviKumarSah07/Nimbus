"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { formatCurrency } from "../../lib/formatCurrency";
import type { ProductFiltersProps } from "./ProductFilters";

/**
 * Shows what's currently narrowing the results and lets each one be removed
 * individually. Without this, an active filter is invisible on mobile once
 * the filter sheet is closed and an empty grid looks like a broken page.
 */
export function ActiveFilterChips({ categories, brands }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const flatCategories = categories.flatMap((c) => [c, ...c.children]);

  const chips: { key: string; label: string }[] = [];

  const category = searchParams.get("category");
  if (category) {
    chips.push({ key: "category", label: flatCategories.find((c) => c.slug === category)?.name ?? category });
  }

  const brand = searchParams.get("brand");
  if (brand) {
    chips.push({ key: "brand", label: brands.find((b) => b.slug === brand)?.name ?? brand });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const from = minPrice ? formatCurrency(Number(minPrice)) : "Any";
    const to = maxPrice ? formatCurrency(Number(maxPrice)) : "Any";
    chips.push({ key: "price", label: `${from} – ${to}` });
  }

  const minRating = searchParams.get("minRating");
  if (minRating) chips.push({ key: "minRating", label: `${minRating}★ & up` });
  if (searchParams.get("inStock") === "true") chips.push({ key: "inStock", label: "In stock" });
  if (searchParams.get("onSale") === "true") chips.push({ key: "onSale", label: "On sale" });

  if (chips.length === 0) return null;

  function remove(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => remove(chip.key)}
          className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push(pathname, { scroll: false })}
        className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
