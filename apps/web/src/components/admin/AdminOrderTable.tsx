"use client";

import Link from "next/link";
import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@ecommerce/shared";
import { useGetAdminOrdersQuery } from "../../store/api/admin/ordersApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
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

export function AdminOrderTable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const { data, isLoading } = useGetAdminOrdersQuery({ page, limit: 20, status: status || undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">
          Status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
        >
          <option value="">All orders</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading || !data ? (
        <Spinner label="Loading orders" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No orders here" description="No orders match this filter yet." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.user?.email ?? order.guestEmail ?? "Guest"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={PAYMENT_TONE[order.paymentStatus]}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(Number(order.grandTotal))}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm text-slate-500">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
