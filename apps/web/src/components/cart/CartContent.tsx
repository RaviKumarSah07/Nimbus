"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { useGetCartQuery } from "../../store/api/cartApi";
import { useAppSelector } from "../../store/hooks";
import { CartLineItem } from "./CartLineItem";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../lib/formatCurrency";

export function CartContent() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const { data, isLoading } = useGetCartQuery(undefined, { skip: authStatus === "idle" || authStatus === "loading" });
  const router = useRouter();

  if (authStatus === "idle" || authStatus === "loading" || isLoading) {
    return <Spinner label="Loading your cart" />;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Browse the catalog and add something you like."
        action={
          <Button onClick={() => router.push("/products")} className="mt-2">
            Start shopping
          </Button>
        }
      />
    );
  }

  const hasBlockingIssue = items.some((item) => item.quantity > item.availableStock);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-md bg-white shadow-card lg:col-span-2">
        <ul>
          {items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-md bg-white p-5 shadow-card">
        <h2 className="border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Price details</h2>
        <dl className="mt-4 flex justify-between text-sm text-slate-600">
          <dt>Subtotal ({data?.itemCount} items)</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(data?.subtotal ?? 0)}</dd>
        </dl>
        <p className="mt-1 text-xs text-slate-400">Shipping, tax, and any coupon are calculated at checkout.</p>

        {hasBlockingIssue && (
          <p className="mt-3 text-xs text-red-600">Resolve the stock warnings above before checking out.</p>
        )}

        <Button
          variant="cta"
          size="lg"
          className="mt-4 w-full"
          disabled={hasBlockingIssue}
          onClick={() => router.push("/checkout")}
        >
          Proceed to checkout
        </Button>
        <Link href="/products" className="mt-3 block text-center text-sm text-brand-600 hover:underline">
          Continue shopping
        </Link>

        <p className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Safe and secure checkout
        </p>
      </aside>
    </div>
  );
}
