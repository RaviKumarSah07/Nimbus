import type { PaginatedResult } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminReviewDto } from "../../../lib/types-admin";

export interface AdminReviewQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  rating?: number;
  verifiedOnly?: boolean;
}

export const adminReviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminReviews: builder.query<PaginatedResult<AdminReviewDto>, AdminReviewQueryParams | void>({
      query: (params) => ({ url: "/admin/reviews", params: { page: 1, limit: 20, ...params } }),
      transformResponse: unwrap<PaginatedResult<AdminReviewDto>>,
      providesTags: (result) =>
        result
          ? [...result.items.map((r) => ({ type: "AdminReview" as const, id: r.id })), { type: "AdminReview" as const, id: "LIST" }]
          : [{ type: "AdminReview", id: "LIST" }],
    }),
    deleteAdminReview: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: [{ type: "AdminReview", id: "LIST" }, "Product"],
    }),
  }),
});

export const { useGetAdminReviewsQuery, useDeleteAdminReviewMutation } = adminReviewsApi;
