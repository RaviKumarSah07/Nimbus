"use client";

import { useEffect, useState } from "react";
import { useGetProductsByIdsQuery } from "../../store/api/productsApi";
import { ProductShelf } from "../home/ProductShelf";
import { readRecentlyViewed } from "../../lib/recentlyViewed";

export function RecentlyViewed({ excludeProductId }: { excludeProductId?: string }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readRecentlyViewed().filter((id) => id !== excludeProductId));
  }, [excludeProductId]);

  const { data } = useGetProductsByIdsQuery(ids, { skip: ids.length === 0 });

  if (!data || data.length === 0) return null;

  return <ProductShelf title="Recently viewed" viewAllHref="/products" products={data} />;
}
