"use client";

import { useState } from "react";
import Image from "next/image";
import { Truck } from "lucide-react";
import { CUSTOMER_CANCELLABLE_STATUSES, type OrderStatus } from "@ecommerce/shared";
import { useGetMyOrderQuery, useCancelOrderMutation, useRequestReturnMutation } from "../../store/api/ordersApi";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Badge } from "../ui/Badge";
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

export function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useGetMyOrderQuery(orderId);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [requestReturn, { isLoading: isRequestingReturn }] = useRequestReturnMutation();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  if (isLoading) return <Spinner label="Loading order" />;
  if (!order) return <p className="text-sm text-red-600">Order not found.</p>;

  const canCancel = CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);
  const canReturn = order.status === "DELIVERED";

  async function handleCancel() {
    await cancelOrder({ id: orderId, reason: cancelReason || "Customer requested cancellation" });
    setShowCancelForm(false);
  }

  async function handleReturnSubmit(orderItemId: string) {
    await requestReturn({ orderId, orderItemId, reason: returnReason || "Not satisfied with the item" });
    setReturningItemId(null);
    setReturnReason("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
            <p className="text-xs text-slate-500">Placed {order.placedAt ? new Date(order.placedAt).toLocaleString() : "—"}</p>
          </div>
          <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
        </div>

        <ul className="divide-y divide-slate-100 rounded-md bg-white shadow-card">
          {order.items.map((item) => {
            const existingReturn = order.returnRequests?.find((r) => r.orderItemId === item.id);
            return (
              <li key={item.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageSnapshot && <Image src={item.imageSnapshot} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.nameSnapshot}</p>
                    {item.variantSnapshot && <p className="text-xs text-slate-500">{item.variantSnapshot}</p>}
                    <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(Number(item.priceSnapshot) * item.quantity)}</p>
                </div>

                {existingReturn ? (
                  <Badge tone="neutral">Return {existingReturn.status.toLowerCase()}</Badge>
                ) : (
                  canReturn &&
                  (returningItemId === item.id ? (
                    <div className="flex gap-2">
                      <input
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="Reason for return"
                        className="h-9 flex-1 rounded-lg border border-slate-300 px-2 text-sm"
                      />
                      <Button size="sm" isLoading={isRequestingReturn} onClick={() => handleReturnSubmit(item.id)}>
                        Submit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReturningItemId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setReturningItemId(item.id)} className="w-fit text-xs font-medium text-brand-600 hover:underline">
                      Request return
                    </button>
                  ))
                )}
              </li>
            );
          })}
        </ul>

        {canCancel && (
          <div className="mt-4">
            {showCancelForm ? (
              <div className="flex gap-2">
                <input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling?"
                  className="h-9 flex-1 rounded-lg border border-slate-300 px-2 text-sm"
                />
                <Button size="sm" variant="danger" isLoading={isCancelling} onClick={handleCancel}>
                  Confirm cancel
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCancelForm(false)}>
                  Never mind
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowCancelForm(true)}>
                Cancel order
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-md bg-white shadow-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tracking</h2>
          {order.statusHistory && <OrderStatusTimeline history={order.statusHistory} />}
        </div>

        {(order.trackingNumber || order.courier) && (
          <div className="flex items-center gap-3 rounded-md bg-white shadow-card p-5">
            <Truck className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">Shipped via {order.courier ?? "courier"}</p>
              {order.trackingNumber && <p className="text-slate-500">Tracking number: {order.trackingNumber}</p>}
            </div>
          </div>
        )}

        <div className="rounded-md bg-white shadow-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Summary</h2>
          <dl className="space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(Number(order.subtotal))}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{formatCurrency(Number(order.discountTotal))}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{formatCurrency(Number(order.shippingTotal))}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(Number(order.taxTotal))}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900"><dt>Total</dt><dd>{formatCurrency(Number(order.grandTotal))}</dd></div>
          </dl>
        </div>

        <div className="rounded-md bg-white shadow-card p-5">
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
