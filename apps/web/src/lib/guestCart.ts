const GUEST_CART_TOKEN_KEY = "nimbus_guest_cart_token";

/** Lazily creates a per-browser guest cart identity, persisted so the cart survives a reload. */
export function getOrCreateGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = window.localStorage.getItem(GUEST_CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }
  return token;
}

export function peekGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GUEST_CART_TOKEN_KEY);
}

export function clearGuestCartToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_TOKEN_KEY);
}
