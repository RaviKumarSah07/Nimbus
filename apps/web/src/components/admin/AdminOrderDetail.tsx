"use client";

import { useState } from "react";
import Image from "next/image";
import { Truck } from "lucide-react";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus, type PaymentStatus } from "@ecommerce/shared";
import { useGetAdminOrderQuery, useUpdateAdminOrderStatusMutation } from "../../store/api/admin/ordersApi";
import { OrderStatusTimeline } from "../account/OrderStatusTimeline";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../lib/formatCurrency";

const STATUS_TONE: Record<OrderStatus, "brand" | "success" | "warning" | "danger" | "neutral" | "accent"> = {
  PENDING: "warning",
  PAID: "brand",
  PROCESSING: "accent",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "neutral",
  RETURNED: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, "brand" | "success" | "warning" | "danger" | "neutral" | "accent"> = {
  UNPAID: "neutral",
  PAID: "success",
  REFUNDED: "accent",
  FAILED: "danger",
};

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useGetAdminOrderQuery(orderId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");

  if (isLoading || !order) return <Spinner label="Loading order" />;

  const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status];
  const shippingRequiresTracking = availableTransitions.includes("SHIPPED");

  function handleUpdate(status: OrderStatus) {
    updateStatus({
      id: orderId,
      status,
      note: note || undefined,
      trackingNumber: status === "SHIPPED" ? trackingNumber || undefined : undefined,
      courier: status === "SHIPPED" ? courier || undefined : undefined,
    });
    setNote("");
    setTrackingNumber("");
    setCourier("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="rounded-md bg-white p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">{order.orderNumber}</p>
              <p className="text-sm text-slate-500">{order.user ? `${order.user.name} · ${order.user.email}` : `Guest · ${order.guestEmail}`}</p>
              <p className="text-xs text-slate-400">Placed {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              <Badge tone={PAYMENT_TONE[order.paymentStatus]}>Payment: {order.paymentStatus}</Badge>
            </div>
          </div>

          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {item.imageSnapshot && <Image src={item.imageSnapshot} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.nameSnapshot}</p>
                  {item.variantSnapshot && <p className="text-xs text-slate-500">{item.variantSnapshot}</p>}
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(item.priceSnapshot) * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </div>

        {(order.trackingNumber || order.courier) && (
          <div className="flex items-center gap-3 rounded-md bg-white p-5 shadow-card">
            <Truck className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">Shipment</p>
              <p className="text-slate-500">
                {order.courier ?? "Courier"} {order.trackingNumber && `· Tracking ${order.trackingNumber}`}
              </p>
            </div>
          </div>
        )}

        {availableTransitions.length > 0 && (
          <div className="rounded-md bg-white p-5 shadow-card">
            <p className="mb-3 text-sm font-semibold text-slate-900">Update status</p>

            {shippingRequiresTracking && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label="Tracking number (optional)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK123456789"
                />
                <Input label="Courier (optional)" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. BlueDart" />
              </div>
            )}

            <label htmlFor="status-note" className="sr-only">
              Note
            </label>
            <input
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note for this update (optional)"
              className="mb-3 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "CANCELLED" ? "danger" : "primary"}
                  isLoading={isUpdating}
                  onClick={() => handleUpdate(status)}
                >
                  Mark as {status}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-md bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Timeline</h2>
          {order.statusHistory && <OrderStatusTimeline history={order.statusHistory} />}
        </div>

        <div className="rounded-md bg-white p-5 shadow-card">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Summary</h2>
          <dl className="space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(Number(order.subtotal))}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{formatCurrency(Number(order.discountTotal))}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{formatCurrency(Number(order.shippingTotal))}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(Number(order.taxTotal))}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900"><dt>Total</dt><dd>{formatCurrency(Number(order.grandTotal))}</dd></div>
          </dl>
        </div>

        <div className="rounded-md bg-white p-5 shadow-card">
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
      </div>
    </div>
  );
}
