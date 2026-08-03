import type { CheckoutInput, ConfirmCheckoutInput } from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";

export interface CheckoutResult {
  checkoutUrl: string;
  orderId: string;
  orderNumber: string;
}

export interface ConfirmCheckoutResult {
  orderId: string;
  paymentStatus: string;
  status: string;
  alreadyConfirmed: boolean;
}

export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startCheckout: builder.mutation<CheckoutResult, CheckoutInput>({
      query: (body) => ({ url: "/checkout", method: "POST", body }),
      transformResponse: unwrap<CheckoutResult>,
      invalidatesTags: ["Cart"],
    }),

    // Settles the order on return from the gateway. The invalidations here are
    // what make the rest of the app catch up immediately: the cart empties, the
    // customer's orders refresh, and any admin with a screen open sees the new
    // paid order and updated revenue - the same tags the server pushes over SSE.
    confirmCheckout: builder.mutation<ConfirmCheckoutResult, ConfirmCheckoutInput>({
      query: (body) => ({ url: "/checkout/confirm", method: "POST", body }),
      transformResponse: unwrap<ConfirmCheckoutResult>,
      invalidatesTags: ["Cart", "Order", "AdminOrder", "AdminDashboard"],
    }),
  }),
});

export const { useStartCheckoutMutation, useConfirmCheckoutMutation } = checkoutApi;
