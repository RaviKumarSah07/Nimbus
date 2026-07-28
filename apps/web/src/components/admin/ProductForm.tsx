"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useGetAdminCategoriesQuery } from "../../store/api/admin/categoriesApi";
import { useGetAdminBrandsQuery, useCreateAdminProductMutation, useUpdateAdminProductMutation } from "../../store/api/admin/productsApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { AdminProductDto } from "../../lib/types-admin";

interface VariantRow {
  id?: string;
  sku: string;
  size: string;
  color: string;
  priceOverride: string;
  stock: string;
}

interface ImageRow {
  url: string;
  altText: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({ initial }: { initial?: AdminProductDto }) {
  const router = useRouter();
  const { data: categories } = useGetAdminCategoriesQuery();
  const { data: brands } = useGetAdminBrandsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateAdminProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateAdminProductMutation();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice ?? "");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      priceOverride: v.priceOverride ?? "",
      stock: String(v.stock),
    })) ?? [{ sku: "", size: "", color: "", priceOverride: "", stock: "0" }],
  );

  const [images, setImages] = useState<ImageRow[]>(
    initial?.images.map((img) => ({ url: img.url, altText: img.altText ?? "" })) ?? [{ url: "", altText: "" }],
  );

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }
  function updateImage(index: number, patch: Partial<ImageRow>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      slug,
      description,
      categoryId,
      brandId: brandId || undefined,
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      isFeatured,
      isActive,
      variants: variants
        .filter((v) => v.sku.trim())
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size || undefined,
          color: v.color || undefined,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
          stock: Number(v.stock || 0),
        })),
      images: images
        .filter((img) => img.url.trim())
        .map((img, i) => ({ url: img.url, altText: img.altText || undefined, position: i })),
    };

    try {
      if (initial) {
        await updateProduct({ id: initial.id, input: payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      router.push("/admin/products");
    } catch (err) {
      setError((err as { data?: { error?: { message?: string; fields?: { message: string }[] } } })?.data?.error?.message ?? "Something went wrong");
    }
  }

  const flatCategories = categories?.flatMap((c) => (c.parentId ? [] : [c, ...(categories.filter((child) => child.parentId === c.id) ?? [])])) ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <Input
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!initial) setSlug(slugify(e.target.value));
          }}
          required
        />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="">Select a category</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `— ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Brand (optional)
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">No brand</option>
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <Input label="Base price" type="number" min={0} step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
        <Input
          label="Compare-at price (optional)"
          type="number"
          min={0}
          step="0.01"
          value={compareAtPrice}
          onChange={(e) => setCompareAtPrice(e.target.value)}
          hint="Set higher than base price to show a sale badge."
        />

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Active (visible in store)
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Variants</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setVariants((prev) => [...prev, { sku: "", size: "", color: "", priceOverride: "", stock: "0" }])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add variant
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-6">
              <Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} required />
              <Input placeholder="Size" value={variant.size} onChange={(e) => updateVariant(index, { size: e.target.value })} />
              <Input placeholder="Color" value={variant.color} onChange={(e) => updateVariant(index, { color: e.target.value })} />
              <Input
                placeholder="Price override"
                type="number"
                step="0.01"
                value={variant.priceOverride}
                onChange={(e) => updateVariant(index, { priceOverride: e.target.value })}
              />
              <Input
                placeholder="Stock"
                type="number"
                min={0}
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                disabled={variants.length === 1}
                aria-label="Remove variant"
                className="flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Images</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => setImages((prev) => [...prev, { url: "", altText: "" }])}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add image
          </Button>
        </div>
        <p className="mb-3 text-xs text-slate-500">Paste an image URL (Cloudinary direct-upload is used automatically when configured).</p>
        <div className="flex flex-col gap-2">
          {images.map((image, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-[2fr_1fr_auto]">
              <Input placeholder="https://..." value={image.url} onChange={(e) => updateImage(index, { url: e.target.value })} />
              <Input placeholder="Alt text" value={image.altText} onChange={(e) => updateImage(index, { altText: e.target.value })} />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove image"
                className="flex items-center justify-center text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" isLoading={isCreating || isUpdating}>
          {initial ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
