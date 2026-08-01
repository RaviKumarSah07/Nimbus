"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDownUp, Check, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import type { ProductSortOption } from "@ecommerce/shared";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { ProductFilterControls, countActiveFilters, type ProductFiltersProps } from "./ProductFilters";

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price -- Low to High" },
  { value: "price_desc", label: "Price -- High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Customer Rating" },
];

/**
 * Sticky Sort / Filter bar for narrow screens. Keeping both behind sheets is
 * what lets the product grid sit at the top of the page on mobile instead of
 * below a full-height filter panel.
 */
export function MobileFilterBar({ categories, brands }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openSheet, setOpenSheet] = useState<"filters" | "sort" | null>(null);

  const activeCount = countActiveFilters(new URLSearchParams(searchParams.toString()));
  const currentSort = searchParams.get("sort") ?? "newest";

  function applySort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpenSheet(null);
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
    setOpenSheet(null);
  }

  return (
    <>
      {/* Fixed rather than sticky so it can span the full viewport width
          without fighting the Container's responsive padding. The products
          page reserves matching bottom padding. */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(20,30,60,0.08)] lg:hidden">
        <button
          type="button"
          onClick={() => setOpenSheet("sort")}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
          Sort
        </button>
        <button
          type="button"
          onClick={() => setOpenSheet("filters")}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filter
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <BottomSheet
        open={openSheet === "sort"}
        onClose={() => setOpenSheet(null)}
        title="Sort by"
      >
        <ul className="flex flex-col">
          {SORT_OPTIONS.map((option) => {
            const isActive = currentSort === option.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => applySort(option.value)}
                  aria-pressed={isActive}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm",
                    isActive ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 active:bg-slate-50",
                  )}
                >
                  {option.label}
                  {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={openSheet === "filters"}
        onClose={() => setOpenSheet(null)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={clearAll}>
              Clear all
            </Button>
            <Button type="button" variant="cta" className="flex-1" onClick={() => setOpenSheet(null)}>
              Show results
            </Button>
          </div>
        }
      >
        <ProductFilterControls categories={categories} brands={brands} />
      </BottomSheet>
    </>
  );
}
