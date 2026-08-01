import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PROMOS = [
  {
    href: "/products?onSale=true",
    eyebrow: "Clearance",
    title: "Everything on sale",
    detail: "Reduced prices across electronics, fashion and home.",
    className: "from-brand-700 to-brand-500",
  },
  {
    href: "/products?sort=newest",
    eyebrow: "Just landed",
    title: "New this week",
    detail: "The latest additions to the catalogue, freshly stocked.",
    className: "from-slate-900 to-slate-700",
  },
];

/** Two editorial entry points into real, filtered listings. */
export function PromoSplit() {
  return (
    <section aria-label="Promotions" className="grid gap-4 sm:grid-cols-2">
      {PROMOS.map((promo) => (
        <Link
          key={promo.href}
          href={promo.href}
          className={`group flex flex-col justify-between gap-6 rounded-md bg-gradient-to-br ${promo.className} p-6 text-white shadow-card transition-transform hover:-translate-y-0.5`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">{promo.eyebrow}</p>
            <p className="mt-2 text-2xl font-bold">{promo.title}</p>
            <p className="mt-1 text-sm text-white/80">{promo.detail}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            Shop now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </section>
  );
}
