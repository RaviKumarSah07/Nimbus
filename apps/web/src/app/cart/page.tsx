import type { Metadata } from "next";
import { Container } from "../../components/ui/Container";
import { CartContent } from "../../components/cart/CartContent";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your cart</h1>
      <CartContent />
    </Container>
  );
}
