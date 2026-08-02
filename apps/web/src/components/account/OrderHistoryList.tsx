"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useGetMyOrdersQuery } from "../../store/api/ordersApi";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { Badge } from "../ui/Badge";
import { formatCurrency } from "../../lib/formatCurrency";
import type { OrderStatus } from "@ecommerce/shared";

const STATUS_TONE: Record<OrderStatus, "brand" | "success" | "warning" | "danger" | "neutral" | "accent"> = {
  PENDING: "warning",
  PAID: "brand",
  PROCESSING: "accent",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "neutral",
  RETURNED: "danger",
};

export function OrderHistoryList() {
  const { data, isLoading } = useGetMyOrdersQuery({ page: 1, limit: 20 });

  if (isLoading) return <Spinner label="Loading orders" />;

  if (!data || data.items.length === 0) {
    return <EmptyState icon={Package} title="No orders yet" description="Your order history will show up here after your first purchase." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.items.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="flex flex-col gap-2 rounded-md bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">
                {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(Number(order.grandTotal))}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
