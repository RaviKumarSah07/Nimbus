"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { useGetCartQuery } from "../../store/api/cartApi";

export function CartIcon() {
  const status = useAppSelector((state) => state.auth.status);
  // Wait for auth bootstrap to resolve so we don't fetch a guest cart for a
  // split second before the logged-in user's cart is known.
  const { data } = useGetCartQuery(undefined, { skip: status === "idle" || status === "loading" });
  const count = data?.itemCount ?? 0;

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
      aria-label={`Cart, ${count} items`}
    >
      <span className="relative">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}
