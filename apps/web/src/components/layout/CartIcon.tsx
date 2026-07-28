"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

// Wired up to real cart item counts in the cart milestone (store/api/cartApi).
export function CartIcon() {
  return (
    <Link href="/cart" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label="Cart">
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
