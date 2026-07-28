import type { Metadata } from "next";
import { Container } from "../../components/ui/Container";
import { ProductFilters } from "../../components/product/ProductFilters";
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

  return (
    <Container className="flex flex-col gap-6 py-8 lg:flex-row">
      <ProductFilters categories={categories} brands={brands} />

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {result.meta.total} {result.meta.total === 1 ? "product" : "products"}
          </p>
          <SortSelect current={searchParams.sort ?? "newest"} />
        </div>

        <ProductGrid products={result.items} />
        <Pagination meta={result.meta} buildHref={buildHref} />
      </div>
    </Container>
  );
}
