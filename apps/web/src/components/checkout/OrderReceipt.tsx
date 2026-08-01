"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useGetOrderConfirmationQuery } from "../../store/api/ordersApi";
import { useAppSelector } from "../../store/hooks";
import { Spinner } from "../ui/Spinner";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../lib/formatCurrency";

export function OrderReceipt({ orderId }: { orderId: string }) {
  // Coming back from the payment gateway is a cold page load, so the session
  // is still being restored. Firing this now would 401 and kick off a second,
  // competing token refresh - wait for bootstrap to settle either way.
  const authStatus = useAppSelector((state) => state.auth.status);
  const isRestoringSession = authStatus === "idle" || authStatus === "loading";

  const { data: order, isLoading, error } = useGetOrderConfirmationQuery(orderId, { skip: isRestoringSession });

  if (isRestoringSession || isLoading) return <Spinner label="Loading your order" />;
  if (error || !order) return <p className="text-sm text-red-600">We couldn&apos;t find that order.</p>;

  return (
    <div className="mx-auto max-w-2xl rounded-md bg-white p-8 shadow-card">
      <div className="flex items-center gap-3 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thank you for your order</h1>
          <p className="text-sm text-slate-500">Order {order.orderNumber}</p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {item.imageSnapshot && <Image src={item.imageSnapshot} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{item.nameSnapshot}</p>
              {item.variantSnapshot && <p className="text-xs text-slate-500">{item.variantSnapshot}</p>}
              <p className="text-xs text-slate-500">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-slate-900">{formatCurrency(Number(item.priceSnapshot) * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1.5 text-sm">
        <Row label="Subtotal" value={formatCurrency(Number(order.subtotal))} />
        {Number(order.discountTotal) > 0 && <Row label="Discount" value={`-${formatCurrency(Number(order.discountTotal))}`} tone="emerald" />}
        <Row label="Shipping" value={Number(order.shippingTotal) === 0 ? "Free" : formatCurrency(Number(order.shippingTotal))} />
        <Row label="Tax" value={formatCurrency(Number(order.taxTotal))} />
        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
          <dt>Total</dt>
          <dd>{formatCurrency(Number(order.grandTotal))}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-900">Shipping to</p>
          <p className="text-slate-500">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Order status</p>
          <p className="text-slate-500">{order.status}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/products">
          <Button variant="outline">Continue shopping</Button>
        </Link>
        {order.guestEmail === null && (
          <Link href={`/account/orders/${order.id}`}>
            <Button variant="cta">View order details</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className={`flex justify-between ${tone === "emerald" ? "text-emerald-600" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
