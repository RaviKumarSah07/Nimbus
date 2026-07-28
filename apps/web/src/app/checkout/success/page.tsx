import type { Metadata } from "next";
import { Container } from "../../../components/ui/Container";
import { OrderReceipt } from "../../../components/checkout/OrderReceipt";

export const metadata: Metadata = { title: "Order confirmed" };

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { orderId?: string } }) {
  if (!searchParams.orderId) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-slate-600">No order to show.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <OrderReceipt orderId={searchParams.orderId} />
    </Container>
  );
}
