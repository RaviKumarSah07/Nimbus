import type { CreateCouponInput, UpdateCouponInput } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminCouponDto } from "../../../lib/types-admin";

export const adminCouponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminCoupons: builder.query<AdminCouponDto[], void>({
      query: () => "/admin/coupons",
      transformResponse: unwrap<AdminCouponDto[]>,
      providesTags: ["AdminCoupon"],
    }),
    createAdminCoupon: builder.mutation<AdminCouponDto, CreateCouponInput>({
      query: (body) => ({ url: "/admin/coupons", method: "POST", body }),
      transformResponse: unwrap<AdminCouponDto>,
      invalidatesTags: ["AdminCoupon"],
    }),
    updateAdminCoupon: builder.mutation<AdminCouponDto, { id: string; input: UpdateCouponInput }>({
      query: ({ id, input }) => ({ url: `/admin/coupons/${id}`, method: "PATCH", body: input }),
      transformResponse: unwrap<AdminCouponDto>,
      invalidatesTags: ["AdminCoupon"],
    }),
    deleteAdminCoupon: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["AdminCoupon"],
    }),
  }),
});

export const {
  useGetAdminCouponsQuery,
  useCreateAdminCouponMutation,
  useUpdateAdminCouponMutation,
  useDeleteAdminCouponMutation,
} = adminCouponsApi;
