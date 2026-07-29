import { Star } from "lucide-react";

export function RatingBreakdown({
  avgRating,
  ratingCount,
  breakdown,
}: {
  avgRating: number;
  ratingCount: number;
  breakdown: { star: number; count: number }[];
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded bg-emerald-700 px-3 py-1 text-2xl font-bold text-white">
          {avgRating.toFixed(1)}
          <Star className="h-5 w-5 fill-white" aria-hidden="true" />
        </span>
        <span className="text-xs text-slate-500">{ratingCount} ratings</span>
      </div>
      <div className="flex-1 space-y-1">
        {breakdown.map(({ star, count }) => {
          const percent = ratingCount ? Math.round((count / ratingCount) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-8">{star} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
