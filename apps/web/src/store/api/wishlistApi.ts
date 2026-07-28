import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { ProductSummary } from "../../lib/types";

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query<ProductSummary[], void>({
      query: () => "/wishlist",
      transformResponse: unwrap<ProductSummary[]>,
      providesTags: ["Wishlist"],
    }),
    getWishlistIds: builder.query<string[], void>({
      query: () => "/wishlist/ids",
      transformResponse: unwrap<string[]>,
      providesTags: ["Wishlist"],
    }),
    addToWishlist: builder.mutation<{ added: boolean }, string>({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: "POST" }),
      transformResponse: unwrap<{ added: boolean }>,
      invalidatesTags: ["Wishlist"],
    }),
    removeFromWishlist: builder.mutation<{ removed: boolean }, string>({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: "DELETE" }),
      transformResponse: unwrap<{ removed: boolean }>,
      invalidatesTags: ["Wishlist"],
    }),
  }),
});

export const { useGetWishlistQuery, useGetWishlistIdsQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } = wishlistApi;
