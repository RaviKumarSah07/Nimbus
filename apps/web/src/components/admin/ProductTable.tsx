"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useGetAdminProductsQuery, useDeleteAdminProductMutation } from "../../store/api/admin/productsApi";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../lib/formatCurrency";

export function ProductTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminProductsQuery({ page, limit: 15 });
  const [deleteProduct] = useDeleteAdminProductMutation();

  if (isLoading || !data) return <Spinner label="Loading products" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" /> New product
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="border-b border-slate-50 last:border-none">
                  <td className="px-4 py-2 text-slate-800">{product.name}</td>
                  <td className="px-4 py-2 text-slate-500">{product.category?.name}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(Number(product.basePrice))}</td>
                  <td className="px-4 py-2">
                    <Badge tone={totalStock === 0 ? "danger" : totalStock <= 5 ? "warning" : "neutral"}>{totalStock}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={product.isActive ? "success" : "neutral"}>{product.isActive ? "Active" : "Hidden"}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} aria-label="Edit" className="text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        aria-label="Delete"
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-slate-500">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
