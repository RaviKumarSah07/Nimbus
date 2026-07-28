import type { ApiResponse } from "@ecommerce/shared";

/** RTK Query transformResponse helper: unwraps the backend's {success,data} envelope. */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}
