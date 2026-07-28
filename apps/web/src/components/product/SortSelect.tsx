"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import type { ProductSortOption } from "@ecommerce/shared";

const OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price -- Low to High" },
  { value: "price_desc", label: "Price -- High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Rating" },
];

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-md bg-white p-1.5 shadow-card" role="radiogroup" aria-label="Sort by">
      <span className="shrink-0 pl-2 text-xs font-bold uppercase tracking-wide text-slate-500">Sort by</span>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={current === option.value}
          onClick={() => handleChange(option.value)}
          className={clsx(
            "shrink-0 rounded px-3 py-1.5 text-sm font-medium transition-colors",
            current === option.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
