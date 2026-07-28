import { OrderDetail } from "../../../../components/account/OrderDetail";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetail orderId={params.id} />;
}
