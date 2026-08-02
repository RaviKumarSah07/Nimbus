import { SearchX, Sparkles } from "lucide-react";
import type { ProductMatchType } from "@ecommerce/shared";

/**
 * Only rendered for "fuzzy" or "suggested" - an "exact" match needs no
 * explanation. Mirrors the Amazon/Flipkart pattern of never showing a blank
 * grid for a typo or an unmatched query: say plainly that it's not an exact
 * match, then show something anyway.
 */
export function SearchFallbackNotice({ query, matchType }: { query: string; matchType: ProductMatchType }) {
  if (matchType === "exact") return null;

  const isFuzzy = matchType === "fuzzy";

  return (
    <div className="mb-4 flex items-start gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
      {isFuzzy ? <SearchX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <p>
        {isFuzzy ? (
          <>
            No exact matches for <span className="font-semibold">&quot;{query}&quot;</span> - showing the closest products we found.
          </>
        ) : (
          <>
            No results for <span className="font-semibold">&quot;{query}&quot;</span>. Here are some popular picks instead.
          </>
        )}
      </p>
    </div>
  );
}
