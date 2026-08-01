import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryNode } from "../../lib/types";

/**
 * Large, image-led category cards. The circular tiles at the top of the page
 * are quick navigation for people who already know where they're going; this
 * is the browsable version for people who don't.
 */
export function CategoryShowcase({ categories }: { categories: CategoryNode[] }) {
  const topLevel = categories.filter((c) => c.imageUrl);
  if (topLevel.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="rounded-md bg-white p-4 shadow-card sm:p-6">
      <h2 id="shop-by-category" className="mb-4 border-b border-slate-100 pb-4 text-lg font-bold text-slate-900 sm:text-xl">
        Shop by category
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topLevel.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group relative flex h-44 items-end overflow-hidden rounded-lg bg-slate-100"
          >
            {category.imageUrl && (
              <Image
                src={category.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />

            <div className="relative w-full p-4">
              <p className="text-lg font-bold text-white">{category.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-white/80">
                {category.children.length > 0
                  ? `${category.children.length} subcategories`
                  : "Explore the range"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
