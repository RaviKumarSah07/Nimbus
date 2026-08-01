import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

const VALUE_PROPS = [
  { icon: Truck, label: "Free delivery", detail: "On eligible orders" },
  { icon: ShieldCheck, label: "Secure checkout", detail: "Encrypted payments" },
  { icon: RotateCcw, label: "Easy returns", detail: "Within 7 days" },
  { icon: Headphones, label: "24x7 support", detail: "Real humans, fast" },
];

/**
 * Reassurance strip under the hero. The footer carries the same promises, but
 * they only influence a purchase decision if they're visible before the
 * customer starts browsing.
 */
export function ValuePropsBar() {
  return (
    <section aria-label="Why shop with Nimbus" className="grid grid-cols-2 gap-3 rounded-md bg-white p-4 shadow-card sm:grid-cols-4 sm:p-5">
      {VALUE_PROPS.map(({ icon: Icon, label, detail }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
            <p className="truncate text-xs text-slate-500">{detail}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
