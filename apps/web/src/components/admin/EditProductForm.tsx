"use client";

import { useGetAdminProductQuery } from "../../store/api/admin/productsApi";
import { ProductForm } from "./ProductForm";
import { Spinner } from "../ui/Spinner";

export function EditProductForm({ productId }: { productId: string }) {
  const { data, isLoading } = useGetAdminProductQuery(productId);

  if (isLoading || !data) return <Spinner label="Loading product" />;
  return <ProductForm initial={data} />;
}
