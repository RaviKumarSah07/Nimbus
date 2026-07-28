"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "../../lib/recentlyViewed";

/** No UI - just records this product into the visitor's local recently-viewed list on mount. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    recordRecentlyViewed(productId);
  }, [productId]);

  return null;
}
