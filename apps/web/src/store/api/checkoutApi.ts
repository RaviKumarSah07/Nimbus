import type { CheckoutInput } from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";

export interface CheckoutResult {
  checkoutUrl: string;
  orderId: string;
  orderNumber: string;
}

export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startCheckout: builder.mutation<CheckoutResult, CheckoutInput>({
      query: (body) => ({ url: "/checkout", method: "POST", body }),
      transformResponse: unwrap<CheckoutResult>,
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const { useStartCheckoutMutation } = checkoutApi;
