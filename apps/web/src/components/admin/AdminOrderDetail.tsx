"use client";

import { useState } from "react";
import Image from "next/image";
import type { OrderStatus } from "@ecommerce/shared";
import { useGetAdminOrderQuery, useUpdateAdminOrderStatusMutation } from "../../store/api/admin/ordersApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../lib/formatCurrency";

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useGetAdminOrderQuery(orderId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();
  const [note, setNote] = useState("");

  if (isLoading || !order) return <Spinner label="Loading order" />;

  const availableTransitions = NEXT_STATUSES[order.status];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
            <p className="text-xs text-slate-500">{order.user ? `${order.user.name} (${order.user.email})` : order.guestEmail}</p>
          </div>
          <Badge tone="brand">{order.status}</Badge>
        </div>

        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-4">
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

        {availableTransitions.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Update status</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional, e.g. tracking number)"
              className="mb-3 h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
            />
            <div className="flex gap-2">
              {availableTransitions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "CANCELLED" ? "danger" : "primary"}
                  isLoading={isUpdating}
                  onClick={() => updateStatus({ id: orderId, status, note: note || undefined })}
                >
                  Mark as {status}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Summary</h2>
          <dl className="space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(Number(order.subtotal))}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{formatCurrency(Number(order.discountTotal))}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{formatCurrency(Number(order.shippingTotal))}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(Number(order.taxTotal))}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900"><dt>Total</dt><dd>{formatCurrency(Number(order.grandTotal))}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Shipping address</h2>
          <p className="text-sm text-slate-500">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">History</h2>
          <ul className="space-y-2 text-sm">
            {order.statusHistory?.map((h) => (
              <li key={h.id} className="text-slate-500">
                <span className="font-medium text-slate-800">{h.status}</span> - {new Date(h.createdAt).toLocaleString()}
                {h.note && <div className="text-xs">{h.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
