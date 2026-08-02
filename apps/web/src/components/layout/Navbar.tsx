import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "../ui/Container";
import { SearchBar } from "./SearchBar";
import { AccountMenu } from "./AccountMenu";
import { CartIcon } from "./CartIcon";
import { NotificationBell } from "./NotificationBell";
import { getCategoryTree } from "../../lib/serverApi";

export async function Navbar() {
  const categories = await getCategoryTree();

  return (
    <>
      {/* Deliberately outside the sticky header so it scrolls away and doesn't
          eat vertical space on a phone. */}
      <div className="bg-slate-900 text-slate-300">
        <Container className="flex h-9 items-center justify-center gap-4 text-[11px] font-medium sm:gap-8 sm:text-xs">
          <span>Free delivery on eligible orders</span>
          <span aria-hidden="true" className="text-slate-600">•</span>
          <span>7-day easy returns</span>
          <span aria-hidden="true" className="hidden text-slate-600 sm:inline">•</span>
          <span className="hidden sm:inline">Secure encrypted checkout</span>
        </Container>
      </div>

      <header className="sticky top-0 z-30">
      <div className="bg-brand-600">
        <Container className="flex h-16 items-center gap-4 sm:gap-6">
          <Link href="/" className="shrink-0 text-2xl font-black italic tracking-tight text-white">
            Nimbus
          </Link>

          <div className="hidden flex-1 md:flex">
            <Suspense fallback={<div className="h-10 w-full max-w-2xl rounded-sm bg-white/90" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <CartIcon />
            <AccountMenu />
          </div>
        </Container>

        <div className="border-t border-white/10 p-3 md:hidden">
          <Suspense fallback={<div className="h-10 w-full rounded-sm bg-white/90" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="hidden border-b border-slate-200 bg-white shadow-sm md:block">
          <Container className="flex h-14 items-center gap-7 overflow-x-auto text-sm">
            <Link href="/products" className="shrink-0 font-semibold text-slate-700 hover:text-brand-600">
              All products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap font-medium text-slate-600 hover:text-brand-600"
              >
                {category.imageUrl && (
                  <span className="relative h-6 w-6 overflow-hidden rounded-full bg-slate-100">
                    <Image src={category.imageUrl} alt="" fill sizes="24px" className="object-cover" />
                  </span>
                )}
                {category.name}
              </Link>
            ))}
          </Container>
        </nav>
      )}
      </header>

      {/* Phone-sized screens get the categories as a scrollable chip row below
          the header instead, where it can't crowd out the sticky search. */}
      {categories.length > 0 && (
        <nav aria-label="Categories" className="border-b border-slate-200 bg-white md:hidden">
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5">
            <Link
              href="/products"
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
