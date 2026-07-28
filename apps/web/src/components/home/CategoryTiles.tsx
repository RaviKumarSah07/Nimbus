import Image from "next/image";
import Link from "next/link";
import type { CategoryNode } from "../../lib/types";

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
            {category.imageUrl && (
              <Image src={category.imageUrl} alt="" fill sizes="64px" className="object-cover transition-transform group-hover:scale-110" />
            )}
          </div>
          <span className="text-sm font-medium text-slate-800">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}
