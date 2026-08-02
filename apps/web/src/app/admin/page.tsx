"use client";

import Link from "next/link";
import { DollarSign, ShoppingBag, Users, AlertTriangle, CheckCircle2, Clock, Undo2 } from "lucide-react";
import { useGetAdminDashboardQuery } from "../../store/api/admin/dashboardApi";
import { StatTile } from "../../components/admin/StatTile";
import { RevenueChart } from "../../components/admin/RevenueChart";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
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

export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAdminDashboardQuery();

  if (isLoading || !data) return <Spinner label="Loading dashboard" />;

  const totalOrders = Object.values(data.orderCountsByStatus).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} />
        <StatTile label="Orders" value={String(totalOrders)} icon={ShoppingBag} />
        <StatTile label="Customers" value={String(data.totalCustomers)} icon={Users} />
        <StatTile label="Low stock SKUs" value={String(data.lowStockVariants.length)} icon={AlertTriangle} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Revenue breakdown</h2>
        <p className="mb-4 text-xs text-slate-500">How much of what&apos;s been collected is actually earned versus still at risk.</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <RevenueBreakdownItem
            icon={DollarSign}
            label="Gross revenue"
            hint="All paid orders"
            value={formatCurrency(data.totalRevenue)}
            tone="text-slate-900"
          />
          <RevenueBreakdownItem
            icon={CheckCircle2}
            label="Confirmed"
            hint="Delivered orders"
            value={formatCurrency(data.confirmedRevenue)}
            tone="text-emerald-700"
          />
          <RevenueBreakdownItem
            icon={Clock}
            label="Pending"
            hint="Paid, still in transit"
            value={formatCurrency(data.pendingRevenue)}
            tone="text-accent-700"
          />
          <RevenueBreakdownItem
            icon={Undo2}
            label="Refunded"
            hint="Cancelled or returned after payment"
            value={formatCurrency(data.refundedAmount)}
            tone="text-red-700"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Revenue - last 14 days</h2>
          <RevenueChart data={data.revenueSeries} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Orders by status</h2>
          <ul className="flex flex-col gap-2">
            {(Object.keys(STATUS_TONE) as OrderStatus[]).map((status) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                <span className="font-medium text-slate-900">{data.orderCountsByStatus[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Low stock</h2>
          {data.lowStockVariants.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing low on stock right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.lowStockVariants.map((v) => (
                <li key={v.variantId} className="flex items-center justify-between text-sm">
                  <Link href={`/product/${v.productSlug}`} className="text-slate-700 hover:underline">
                    {v.productName} <span className="text-slate-400">({v.sku})</span>
                  </Link>
                  <Badge tone={v.stock === 0 ? "danger" : "warning"}>{v.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {data.recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between text-sm hover:text-brand-700">
                  <span className="text-slate-700">{order.orderNumber}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                    <span className="font-medium text-slate-900">{formatCurrency(order.grandTotal)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function RevenueBreakdownItem({
  icon: Icon,
  label,
  hint,
  value,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  hint: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
      <div>
        <p className={`text-lg font-bold ${tone}`}>{value}</p>
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
