"use client";

import { Heart } from "lucide-react";
import { useGetWishlistQuery } from "../../store/api/wishlistApi";
import { ProductGrid } from "../product/ProductGrid";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

export function WishlistGrid() {
  const { data, isLoading } = useGetWishlistQuery();

  if (isLoading) return <Spinner label="Loading wishlist" />;
  if (!data || data.length === 0) {
    return <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any product to save it here." />;
  }

  return <ProductGrid products={data} />;
}
