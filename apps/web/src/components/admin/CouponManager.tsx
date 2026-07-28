"use client";

import { useState, type FormEvent } from "react";
import { Trash2, Plus } from "lucide-react";
import type { CouponType } from "@ecommerce/shared";
import {
  useGetAdminCouponsQuery,
  useCreateAdminCouponMutation,
  useUpdateAdminCouponMutation,
  useDeleteAdminCouponMutation,
} from "../../store/api/admin/couponsApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";

export function CouponManager() {
  const { data: coupons, isLoading } = useGetAdminCouponsQuery();
  const [createCoupon, { isLoading: isCreating }] = useCreateAdminCouponMutation();
  const [updateCoupon] = useUpdateAdminCouponMutation();
  const [deleteCoupon] = useDeleteAdminCouponMutation();

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Loading coupons" />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCoupon({
        code,
        type,
        value: Number(value),
        minSubtotal: minSubtotal ? Number(minSubtotal) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
      }).unwrap();
      setCode("");
      setValue("");
      setMinSubtotal("");
      setUsageLimit("");
    } catch (err) {
      setError((err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "Could not create coupon");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Min. subtotal</th>
                <th className="px-4 py-2">Usage</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {coupons?.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-50 last:border-none">
                  <td className="px-4 py-2 font-medium text-slate-800">{coupon.code}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{coupon.minSubtotal ? `$${coupon.minSubtotal}` : "—"}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {coupon.usageCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => updateCoupon({ id: coupon.id, input: { isActive: !coupon.isActive } })}>
                      <Badge tone={coupon.isActive ? "success" : "neutral"}>{coupon.isActive ? "Active" : "Disabled"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => deleteCoupon(coupon.id)}
                      aria-label="Delete coupon"
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex h-fit flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">New coupon</h2>
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </label>
        <Input label={type === "PERCENTAGE" ? "Percent off" : "Amount off"} type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} required />
        <Input label="Minimum subtotal (optional)" type="number" min={0} value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} />
        <Input label="Usage limit (optional)" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" isLoading={isCreating} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" /> Create coupon
        </Button>
      </form>
    </div>
  );
}
