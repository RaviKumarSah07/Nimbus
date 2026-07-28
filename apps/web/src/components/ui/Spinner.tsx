import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center py-10">
      <Loader2 className={clsx("h-6 w-6 animate-spin text-brand-500", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
