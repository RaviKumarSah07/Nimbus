import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "../../components/ui/Container";
import { ProductFilters } from "../../components/product/ProductFilters";
import { MobileFilterBar } from "../../components/product/MobileFilterBar";
import { ActiveFilterChips } from "../../components/product/ActiveFilterChips";
import { SortSelect } from "../../components/product/SortSelect";
import { ProductGrid } from "../../components/product/ProductGrid";
import { Pagination } from "../../components/ui/Pagination";
import { getBrands, getCategoryTree, getProducts } from "../../lib/serverApi";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse electronics, fashion, and home goods with search, filters, and sorting.",
};

interface ProductsPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [categories, brands, result] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    getProducts(searchParams),
  ]);

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set("page", String(page));
    return `/products?${params.toString()}`;
  }

  const activeCategoryName = searchParams.category
    ? categories.flatMap((c) => [c, ...c.children]).find((c) => c.slug === searchParams.category)?.name
    : undefined;

  return (
    <Container className="flex flex-col gap-4 py-4 pb-24 lg:flex-row lg:pb-4">
      {/* Sidebar on desktop only. On mobile the same controls live in the
          sticky bar below, so the grid is the first thing you see. */}
      <ProductFilters categories={categories} brands={brands} />

      <div className="flex-1">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-slate-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          {activeCategoryName ? (
            <>
              <Link href="/products" className="hover:text-brand-600">All products</Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="font-medium text-slate-700">{activeCategoryName}</span>
            </>
          ) : (
            <span className="font-medium text-slate-700">All products</span>
          )}
        </nav>

        <h1 className="mb-3 text-xl font-bold text-slate-900 sm:text-2xl">{activeCategoryName ?? "All products"}</h1>

        <ActiveFilterChips categories={categories} brands={brands} />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{result.meta.total}</span>{" "}
            {result.meta.total === 1 ? "product" : "products"} found
          </p>
          {/* The pill row is a desktop affordance; below lg, sorting lives in
              the same sticky bar as filters. */}
          <div className="hidden lg:block">
            <SortSelect current={searchParams.sort ?? "newest"} />
          </div>
        </div>

        <ProductGrid products={result.items} />
        <Pagination meta={result.meta} buildHref={buildHref} />

        <MobileFilterBar categories={categories} brands={brands} />
      </div>
    </Container>
  );
}
