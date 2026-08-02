import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../makeStore";
import { setCredentials, clearCredentials } from "../authSlice";
import { getOrCreateGuestCartToken } from "../../lib/guestCart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      const guestToken = getOrCreateGuestCartToken();
      if (guestToken) headers.set("x-guest-cart-token", guestToken);
    }
    return headers;
  },
});

type BaseQueryResult = Awaited<ReturnType<typeof rawBaseQuery>>;

/**
 * Every refresh in the app has to share one in-flight request - both the
 * explicit one AuthBootstrap fires on a cold page load and the implicit ones
 * a 401 triggers. Refresh tokens are single-use and rotated server-side, so a
 * second call carrying the same cookie looks exactly like token reuse, which
 * revokes every session the user has.
 *
 * That is what logged people out after paying: returning from the payment
 * gateway is a full page load, so the in-memory access token is gone,
 * AuthBootstrap refreshes, and the order-confirmation query 401s and
 * refreshes at the same instant. Two rotations, same cookie, session nuked.
 */
let refreshInFlight: Promise<BaseQueryResult> | null = null;

function refreshOnce(
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<BaseQueryResult> {
  refreshInFlight ??= Promise.resolve(rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions)).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Only the server saying "this token is no good" ends the session. A refresh
 * that fails because of a rate limit, a 5xx, or an offline blip means we
 * couldn't ask - the cookie may well still be valid - so the session is left
 * alone and the caller just gets its error. Clearing on any failure meant one
 * unlucky response signed the user out mid-purchase.
 */
function isSessionInvalid(status: FetchBaseQueryError["status"] | undefined) {
  return status === 401 || status === 403;
}

/**
 * Wraps fetchBaseQuery with silent-refresh-and-retry: on a 401 (expired
 * access token) it calls /auth/refresh using the httpOnly cookie, updates
 * the in-memory access token, and retries the original request exactly
 * once.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const requestUrl = typeof args === "string" ? args : args.url;

  // Callers asking for a refresh directly join the shared request rather than
  // opening a second, competing rotation.
  if (requestUrl === "/auth/refresh") {
    return refreshOnce(api, extraOptions);
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await refreshOnce(api, extraOptions);

    if (refreshResult?.data) {
      const data = refreshResult.data as { data: { user: unknown; accessToken: string } };
      api.dispatch(setCredentials({ user: data.data.user as never, accessToken: data.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else if (isSessionInvalid(refreshResult?.error?.status)) {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Product",
    "AdminProduct",
    "Category",
    "AdminCategory",
    "Brand",
    "Cart",
    "Wishlist",
    "Review",
    "Order",
    "AdminOrder",
    "Address",
    "AdminUser",
    "AdminCoupon",
    "AdminBanner",
    "AdminDashboard",
    "AdminReview",
    "Notification",
  ],
  endpoints: () => ({}),
});
