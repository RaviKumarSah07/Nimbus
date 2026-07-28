import Link from "next/link";
import { Container } from "../ui/Container";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-slate-900">Nimbus</p>
          <p className="mt-2 text-sm text-slate-500">
            A portfolio storefront demonstrating a full-stack e-commerce build - catalog, cart, checkout, and an admin console.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/products" className="hover:text-slate-900">All products</Link></li>
            <li><Link href="/products?sort=newest" className="hover:text-slate-900">New arrivals</Link></li>
            <li><Link href="/products?onSale=true" className="hover:text-slate-900">On sale</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Account</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/account/orders" className="hover:text-slate-900">Order history</Link></li>
            <li><Link href="/account/wishlist" className="hover:text-slate-900">Wishlist</Link></li>
            <li><Link href="/account/addresses" className="hover:text-slate-900">Addresses</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/account/orders" className="hover:text-slate-900">Track an order</Link></li>
            <li><Link href="/forgot-password" className="hover:text-slate-900">Reset password</Link></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        Built as a portfolio project. Not a real store - no real payments are processed.
      </div>
    </footer>
  );
}
