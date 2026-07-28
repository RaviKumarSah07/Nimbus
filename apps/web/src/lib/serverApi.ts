import type { PaginatedResult } from "@ecommerce/shared";
import type { BannerDto, BrandSummary, CategoryNode, ProductDetail, ProductSummary } from "./types";

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

export async function getProducts(query: Record<string, string | undefined>): Promise<PaginatedResult<ProductSummary>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) qs.set(key, value);
  }
  const result = await apiFetch<PaginatedResult<ProductSummary>>(`/products?${qs.toString()}`, { tags: ["products"] });
  return result ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return apiFetch<ProductDetail>(`/products/${slug}`, { tags: [`product:${slug}`], allowNotFound: true });
}

export async function getRelatedProducts(slug: string): Promise<ProductSummary[]> {
  return (await apiFetch<ProductSummary[]>(`/products/${slug}/related`)) ?? [];
}

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (!ids.length) return [];
  return (await apiFetch<ProductSummary[]>(`/products/by-ids?ids=${ids.join(",")}`, { revalidate: 0 })) ?? [];
}
