"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Trash2, Plus } from "lucide-react";
import {
  useGetAdminBannersQuery,
  useCreateAdminBannerMutation,
  useUpdateAdminBannerMutation,
  useDeleteAdminBannerMutation,
} from "../../store/api/admin/bannersApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";

export function BannerManager() {
  const { data: banners, isLoading } = useGetAdminBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateAdminBannerMutation();
  const [updateBanner] = useUpdateAdminBannerMutation();
  const [deleteBanner] = useDeleteAdminBannerMutation();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Loading banners" />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createBanner({ title, imageUrl, linkUrl: linkUrl || undefined, position: banners?.length ?? 0 }).unwrap();
      setTitle("");
      setImageUrl("");
      setLinkUrl("");
    } catch (err) {
      setError((err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "Could not create banner");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {banners?.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image src={banner.imageUrl} alt="" fill sizes="112px" className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{banner.title}</p>
              {banner.linkUrl && <p className="text-xs text-slate-500">{banner.linkUrl}</p>}
            </div>
            <button type="button" onClick={() => updateBanner({ id: banner.id, input: { isActive: !banner.isActive } })}>
              <Badge tone={banner.isActive ? "success" : "neutral"}>{banner.isActive ? "Active" : "Hidden"}</Badge>
            </button>
            <button type="button" onClick={() => deleteBanner(banner.id)} aria-label="Delete banner" className="text-slate-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {(!banners || banners.length === 0) && <p className="text-sm text-slate-500">No banners yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex h-fit flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">New banner</h2>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
        <Input label="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/products?category=audio" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" isLoading={isCreating} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" /> Create banner
        </Button>
      </form>
    </div>
  );
}
