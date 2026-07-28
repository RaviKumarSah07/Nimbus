import Image from "next/image";
import Link from "next/link";
import type { CategoryNode } from "../../lib/types";

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;

  const allTiles = categories.flatMap((c) => [c, ...c.children]);

  return (
    <div className="rounded-md bg-white p-4 shadow-card sm:p-6">
      <div className="flex gap-6 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-9">
        {allTiles.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group flex shrink-0 flex-col items-center gap-2 text-center"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-slate-100 ring-1 ring-transparent transition group-hover:ring-brand-300">
              {category.imageUrl && (
                <Image src={category.imageUrl} alt="" fill sizes="80px" className="object-cover transition-transform group-hover:scale-110" />
              )}
            </div>
            <span className="w-20 text-xs font-medium text-slate-700 group-hover:text-brand-700">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
