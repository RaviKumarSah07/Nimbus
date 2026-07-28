import { AdminOrderDetail } from "../../../../components/admin/AdminOrderDetail";

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <AdminOrderDetail orderId={params.id} />;
}
