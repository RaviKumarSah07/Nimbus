import type { Metadata } from "next";
import { Container } from "../../components/ui/Container";
import { CartContent } from "../../components/cart/CartContent";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <Container className="py-4">
      <h1 className="mb-4 text-xl font-bold text-slate-900">My cart</h1>
      <CartContent />
    </Container>
  );
}
