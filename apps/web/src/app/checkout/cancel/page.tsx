import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Container } from "../../../components/ui/Container";
import { Button } from "../../../components/ui/Button";

export const metadata: Metadata = { title: "Checkout cancelled" };

export default function CheckoutCancelPage() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <XCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
      <h1 className="text-xl font-bold text-slate-900">Checkout was cancelled</h1>
      <p className="max-w-sm text-sm text-slate-500">No payment was made. Your cart is still saved if you&apos;d like to try again.</p>
      <Link href="/cart">
        <Button>Return to cart</Button>
      </Link>
    </Container>
  );
}
