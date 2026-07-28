import Link from "next/link";
import clsx from "clsx";
import type { PaginationMeta } from "@ecommerce/shared";

/** Pure server-renderable pagination - just links with an updated `page` param, no client JS needed. */
export function Pagination({ meta, buildHref }: { meta: PaginationMeta; buildHref: (page: number) => string }) {
  if (meta.totalPages <= 1) return null;

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-8">
      <Link
        href={buildHref(Math.max(1, meta.page - 1))}
        aria-disabled={meta.page === 1}
        className={clsx(
          "rounded-md px-3 py-2 text-sm font-medium",
          meta.page === 1 ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-100",
        )}
      >
        Previous
      </Link>

      {pages.map((page, idx) => (
        <span key={page} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== page - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link
            href={buildHref(page)}
            aria-current={page === meta.page ? "page" : undefined}
            className={clsx(
              "min-w-[2.25rem] rounded-md px-3 py-2 text-center text-sm font-medium",
              page === meta.page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {page}
          </Link>
        </span>
      ))}

      <Link
        href={buildHref(Math.min(meta.totalPages, meta.page + 1))}
        aria-disabled={meta.page === meta.totalPages}
        className={clsx(
          "rounded-md px-3 py-2 text-sm font-medium",
          meta.page === meta.totalPages ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-100",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
