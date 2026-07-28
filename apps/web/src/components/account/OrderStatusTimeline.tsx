import { Check } from "lucide-react";
import clsx from "clsx";
import type { OrderStatusHistoryDto } from "../../lib/types-order";

export function OrderStatusTimeline({ history }: { history: OrderStatusHistoryDto[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {history.map((entry, index) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full",
                index === history.length - 1 ? "bg-brand-600 text-white" : "bg-emerald-100 text-emerald-700",
              )}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {index < history.length - 1 && <span className="h-full w-px flex-1 bg-slate-200" />}
          </div>
          <div className="pb-6">
            <p className="text-sm font-medium text-slate-900">{entry.status}</p>
            <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
            {entry.note && <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
