"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareText, Star, Trash2 } from "lucide-react";
import { useGetAdminReviewsQuery, useDeleteAdminReviewMutation } from "../../store/api/admin/reviewsApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

export function AdminReviewTable() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = useGetAdminReviewsQuery({
    page,
    limit: 20,
    q: q || undefined,
    rating: rating ? Number(rating) : undefined,
    verifiedOnly: verifiedOnly || undefined,
  });
  const [deleteReview, { isLoading: isDeleting }] = useDeleteAdminReviewMutation();

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            resetToFirstPage();
          }}
          placeholder="Search review text, product, or customer"
          className="h-9 w-64 rounded-md border border-slate-300 px-3 text-sm"
        />
        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            resetToFirstPage();
          }}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} star{r === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              resetToFirstPage();
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Verified purchases only
        </label>
      </div>

      {isLoading || !data ? (
        <Spinner label="Loading reviews" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No reviews found" description="No reviews match this filter yet." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((review) => (
                  <tr key={review.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/product/${review.product.slug}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                        {review.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium text-slate-800">{review.user.name}</p>
                      <p className="text-xs text-slate-400">{review.user.email}</p>
                      {review.isVerifiedPurchase && (
                        <Badge tone="success" className="mt-1">
                          Verified
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {review.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-medium text-slate-900">{review.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{review.body}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteReview(review.id)}
                        disabled={isDeleting}
                        aria-label="Delete review"
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
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
