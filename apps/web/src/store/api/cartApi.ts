import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { CartDto } from "../../lib/types-cart";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<CartDto, void>({
      query: () => "/cart",
      transformResponse: unwrap<CartDto>,
      providesTags: ["Cart"],
    }),
    addCartItem: builder.mutation<CartDto, { variantId: string; quantity: number }>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      transformResponse: unwrap<CartDto>,
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: builder.mutation<CartDto, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: "PATCH", body: { quantity } }),
      transformResponse: unwrap<CartDto>,
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: builder.mutation<CartDto, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: "DELETE" }),
      transformResponse: unwrap<CartDto>,
      invalidatesTags: ["Cart"],
    }),
    mergeGuestCart: builder.mutation<CartDto, { guestToken: string }>({
      query: (body) => ({ url: "/cart/merge", method: "POST", body }),
      transformResponse: unwrap<CartDto>,
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useMergeGuestCartMutation,
} = cartApi;
