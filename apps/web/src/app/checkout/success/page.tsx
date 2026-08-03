import type { Metadata } from "next";
import { Container } from "../../../components/ui/Container";
import { OrderReceipt } from "../../../components/checkout/OrderReceipt";

export const metadata: Metadata = { title: "Order confirmed" };

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; session_id?: string };
}) {
  if (!searchParams.orderId) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-slate-600">No order to show.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* session_id is substituted by Stripe on the redirect back and is what
          lets the receipt confirm the payment rather than assume it. */}
      <OrderReceipt orderId={searchParams.orderId} sessionId={searchParams.session_id} />
    </Container>
  );
}
