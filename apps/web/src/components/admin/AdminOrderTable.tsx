"use client";

import Link from "next/link";
import { useState } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@ecommerce/shared";
import { useGetAdminOrdersQuery } from "../../store/api/admin/ordersApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../lib/formatCurrency";

const STATUS_TONE: Record<OrderStatus, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  PAID: "brand",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "neutral",
  RETURNED: "danger",
};

export function AdminOrderTable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const { data, isLoading } = useGetAdminOrdersQuery({ page, limit: 20, status: status || undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-slate-600">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading || !data ? (
        <Spinner label="Loading orders" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Placed</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{order.user?.email ?? order.guestEmail ?? "Guest"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-slate-800">{formatCurrency(Number(order.grandTotal))}</td>
                    <td className="px-4 py-2 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
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
