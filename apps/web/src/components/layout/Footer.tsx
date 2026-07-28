import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { Container } from "../ui/Container";

const valueProps = [
  { icon: Truck, label: "Free delivery", detail: "On eligible orders" },
  { icon: ShieldCheck, label: "Secure payments", detail: "Stripe-powered checkout" },
  { icon: RotateCcw, label: "Easy returns", detail: "Hassle-free requests" },
  { icon: Headphones, label: "24x7 support", detail: "We're here to help" },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-[#172337] text-slate-300">
      <Container className="grid grid-cols-2 gap-6 border-b border-white/10 py-8 sm:grid-cols-4">
        {valueProps.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="h-7 w-7 shrink-0 text-brand-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-400">{detail}</p>
            </div>
          </div>
        ))}
      </Container>

      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-black italic text-white">Nimbus</p>
          <p className="mt-2 text-sm text-slate-400">
            A portfolio storefront demonstrating a full-stack e-commerce build - catalog, cart, checkout, and an admin console.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-white">All products</Link></li>
            <li><Link href="/products?sort=newest" className="hover:text-white">New arrivals</Link></li>
            <li><Link href="/products?onSale=true" className="hover:text-white">On sale</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/account/orders" className="hover:text-white">Order history</Link></li>
            <li><Link href="/account/wishlist" className="hover:text-white">Wishlist</Link></li>
            <li><Link href="/account/addresses" className="hover:text-white">Addresses</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Support</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/account/orders" className="hover:text-white">Track an order</Link></li>
            <li><Link href="/forgot-password" className="hover:text-white">Reset password</Link></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        Built as a portfolio project. Not a real store - no real payments are processed.
      </div>
    </footer>
  );
}
