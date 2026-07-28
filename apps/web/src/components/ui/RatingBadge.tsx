import { Star } from "lucide-react";
import clsx from "clsx";

/**
 * Compact "★ 4.3" pill used anywhere rating is a secondary signal (product
 * cards, PDP summary line) - StarRating.tsx's five-star display is reserved
 * for places rating IS the point (the review form, the rating breakdown).
 */
export function RatingBadge({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  if (rating <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={clsx(
          "inline-flex items-center gap-0.5 rounded bg-emerald-700 font-semibold text-white",
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        )}
      >
        {rating.toFixed(1)}
        <Star className={clsx(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3", "fill-white")} aria-hidden="true" />
      </span>
      {count !== undefined && <span className="text-xs text-slate-500">({count.toLocaleString()})</span>}
    </span>
  );
}
