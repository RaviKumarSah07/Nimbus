import { EditProductForm } from "../../../../../components/admin/EditProductForm";

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <EditProductForm productId={params.id} />;
}
