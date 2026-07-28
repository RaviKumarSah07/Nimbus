import { Star } from "lucide-react";
import clsx from "clsx";

export function StarRating({ rating, size = 16, showValue = false }: { rating: number; size?: number; showValue?: boolean }) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            width={size}
            height={size}
            className={clsx(star <= rounded ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
            aria-hidden="true"
          />
        ))}
      </div>
      {showValue && <span className="text-sm text-slate-600">{rating.toFixed(1)}</span>}
    </div>
  );
}
