import type { Metadata } from "next";
import { Container } from "../../components/ui/Container";
import { CheckoutForm } from "../../components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Checkout</h1>
      <CheckoutForm />
    </Container>
  );
}
