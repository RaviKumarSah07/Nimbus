import type { PaginatedResult, ProductMatchType } from "@ecommerce/shared";
import type { BannerDto, BrandSummary, CategoryNode, ProductDetail, ProductSummary } from "./types";

export type ProductSearchResult = PaginatedResult<ProductSummary> & { matchType: ProductMatchType };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
  allowNotFound?: boolean;
}

/**
 * Thin fetch wrapper for Server Components. Uses Next.js's fetch cache
 * (`revalidate`/`tags`) so public catalog pages are ISR-cached instead of
 * hitting the API on every request, while still being tag-revalidatable
 * once an admin edits a product.
 */
async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: options.revalidate ?? 60, tags: options.tags },
  });

  if (res.status === 404 && options.allowNotFound) return null;

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message ?? `Request failed: ${path}`);
  }
  return json.data as T;
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  return (await apiFetch<CategoryNode[]>("/categories", { tags: ["categories"], revalidate: 300 })) ?? [];
}

export async function getBrands(): Promise<BrandSummary[]> {
  return (await apiFetch<BrandSummary[]>("/brands", { revalidate: 300 })) ?? [];
}

export async function getBanners(): Promise<BannerDto[]> {
  return (await apiFetch<BannerDto[]>("/banners", { revalidate: 300 })) ?? [];
}

export async function getProducts(query: Record<string, string | undefined>): Promise<ProductSearchResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) qs.set(key, value);
  }
  // Not cached, same reasoning as getProductBySlug below: the API already
  // caches this list itself (with real invalidation on admin writes), so
  // adding Next's time-based fetch cache on top only reintroduces the
  // staleness that layer already solved - confirmed live when a deleted
  // product kept appearing in the listing well past its cache window.
  const result = await apiFetch<ProductSearchResult>(`/products?${qs.toString()}`, { tags: ["products"], revalidate: 0 });
  return result ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 }, matchType: "exact" };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  // Not cached: stock and rating/review counts change from direct client
  // calls to the API (add-to-cart, checkout, submitting a review) that
  // Next's fetch cache has no way to know about, so a visitor landing on
  // the PDP right after doing one of those things must see it reflected
  // immediately rather than a stale value from the last revalidation window.
  return apiFetch<ProductDetail>(`/products/${slug}`, { tags: [`product:${slug}`], allowNotFound: true, revalidate: 0 });
}

export async function getRelatedProducts(slug: string): Promise<ProductSummary[]> {
  return (await apiFetch<ProductSummary[]>(`/products/${slug}/related`, { revalidate: 0 })) ?? [];
}

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (!ids.length) return [];
  return (await apiFetch<ProductSummary[]>(`/products/by-ids?ids=${ids.join(",")}`, { revalidate: 0 })) ?? [];
}
