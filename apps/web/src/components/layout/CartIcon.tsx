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
    <Link href="/cart" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label={`Cart, ${count} items`}>
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
