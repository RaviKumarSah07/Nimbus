import Link from "next/link";
import { Suspense } from "react";
import { Container } from "../ui/Container";
import { SearchBar } from "./SearchBar";
import { AccountMenu } from "./AccountMenu";
import { CartIcon } from "./CartIcon";
import { getCategoryTree } from "../../lib/serverApi";

export async function Navbar() {
  const categories = await getCategoryTree();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-slate-900">
          Nimbus
        </Link>

        <div className="hidden flex-1 md:flex">
          <Suspense fallback={<div className="h-10 w-full max-w-lg rounded-lg bg-slate-100" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <CartIcon />
          <AccountMenu />
        </div>
      </Container>

      <nav aria-label="Categories" className="hidden border-t border-slate-100 md:block">
        <Container className="flex h-11 items-center gap-6 overflow-x-auto text-sm">
          <Link href="/products" className="font-medium text-slate-600 hover:text-slate-900">
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="whitespace-nowrap text-slate-600 hover:text-slate-900"
            >
              {category.name}
            </Link>
          ))}
        </Container>
      </nav>

      <div className="border-t border-slate-100 p-3 md:hidden">
        <Suspense fallback={<div className="h-10 w-full rounded-lg bg-slate-100" />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
