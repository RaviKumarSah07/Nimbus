import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../makeStore";
import { setCredentials, clearCredentials } from "../authSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Concurrent 401s must share one refresh call, not fire one each.
let refreshInFlight: ReturnType<typeof rawBaseQuery> | null = null;

/**
 * Wraps fetchBaseQuery with silent-refresh-and-retry: on a 401 (expired
 * access token) it calls /auth/refresh using the httpOnly cookie, updates
 * the in-memory access token, and retries the original request exactly
 * once. If refresh itself fails, the session is cleared and the caller's
 * 401 is returned as-is (the UI treats that as "logged out").
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const requestUrl = typeof args === "string" ? args : args.url;
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && requestUrl !== "/auth/refresh") {
    if (!refreshInFlight) {
      refreshInFlight = rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
      refreshInFlight.finally(() => {
        refreshInFlight = null;
      });
    }
    const refreshResult = await refreshInFlight;

    if (refreshResult?.data) {
      const data = refreshResult.data as { data: { user: unknown; accessToken: string } };
      api.dispatch(setCredentials({ user: data.data.user as never, accessToken: data.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
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
  ],
  endpoints: () => ({}),
});
