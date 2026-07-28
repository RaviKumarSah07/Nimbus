import type { PaginatedResult } from "@ecommerce/shared";
import type { CreateReviewInput } from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { ReviewDto } from "../../lib/types-review";

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query<PaginatedResult<ReviewDto>, { productId: string; page?: number }>({
      query: ({ productId, page }) => ({ url: `/reviews/product/${productId}`, params: { page: page ?? 1, limit: 10 } }),
      transformResponse: unwrap<PaginatedResult<ReviewDto>>,
      providesTags: (_result, _error, { productId }) => [{ type: "Review", id: productId }],
    }),
    createReview: builder.mutation<ReviewDto, { productId: string; input: CreateReviewInput }>({
      query: ({ productId, input }) => ({ url: `/reviews/product/${productId}`, method: "POST", body: input }),
      transformResponse: unwrap<ReviewDto>,
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Review", id: productId }, "Product"],
    }),
  }),
});

export const { useGetProductReviewsQuery, useCreateReviewMutation } = reviewsApi;
