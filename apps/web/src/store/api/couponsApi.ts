import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";

export interface CouponPreview {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  discountAmount: number;
}

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateCoupon: builder.mutation<CouponPreview, { code: string; subtotal: number }>({
      query: (body) => ({ url: "/coupons/validate", method: "POST", body }),
      transformResponse: unwrap<CouponPreview>,
    }),
  }),
});

export const { useValidateCouponMutation } = couponsApi;
