"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/products?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full max-w-2xl">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for products, brands, and categories"
        className="h-10 w-full rounded-sm bg-white pl-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-0 top-0 flex h-10 w-11 items-center justify-center rounded-r-sm text-brand-600 hover:text-brand-700"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
