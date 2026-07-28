"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { useAppSelector } from "../../store/hooks";
import { useGetWishlistIdsQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from "../../store/api/wishlistApi";

export function WishlistButton({
  productId,
  className,
  variant = "overlay",
}: {
  productId: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAuthed = authStatus === "authenticated";
  const router = useRouter();

  const { data: wishlistIds } = useGetWishlistIdsQuery(undefined, { skip: !isAuthed });
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();

  const isWishlisted = Boolean(wishlistIds?.includes(productId));

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (isWishlisted) await removeFromWishlist(productId);
    else await addToWishlist(productId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isAdding || isRemoving}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        variant === "overlay" ? "bg-white/90 shadow-sm backdrop-blur hover:bg-white" : "border border-slate-300 hover:bg-slate-50",
        className,
      )}
    >
      <Heart className={clsx("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "text-slate-600")} aria-hidden="true" />
    </button>
  );
}
