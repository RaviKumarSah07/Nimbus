const RECENTLY_VIEWED_KEY = "nimbus_recently_viewed";
const MAX_ITEMS = 12;

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(productId: string) {
  if (typeof window === "undefined") return;
  const existing = readRecentlyViewed().filter((id) => id !== productId);
  const next = [productId, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}
