"use client";

import { useState } from "react";
import { StarRating } from "../ui/StarRating";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { Button } from "../ui/Button";
import { useGetProductReviewsQuery } from "../../store/api/reviewsApi";

export function ReviewList({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetProductReviewsQuery({ productId, page });

  if (isFetching && !data) return <Spinner label="Loading reviews" />;
  if (!data || data.items.length === 0) {
    return (
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Customer reviews</h2>
        <p className="text-sm text-slate-500">No written reviews yet - be the first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Customer reviews</h2>
      <ul className="flex flex-col gap-4">
        {data.items.map((review) => (
          <li key={review.id} className="border-b border-slate-100 pb-4 last:border-none">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size={14} />
              <p className="text-sm font-medium text-slate-900">{review.title}</p>
              {review.isVerifiedPurchase && <Badge tone="success">Verified purchase</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-600">{review.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {review.user.name} · {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>

      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-slate-500">
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
