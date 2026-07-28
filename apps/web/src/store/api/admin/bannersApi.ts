import type { CreateBannerInput, UpdateBannerInput } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminBannerDto } from "../../../lib/types-admin";

export const adminBannersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminBanners: builder.query<AdminBannerDto[], void>({
      query: () => "/admin/banners",
      transformResponse: unwrap<AdminBannerDto[]>,
      providesTags: ["AdminBanner"],
    }),
    createAdminBanner: builder.mutation<AdminBannerDto, CreateBannerInput>({
      query: (body) => ({ url: "/admin/banners", method: "POST", body }),
      transformResponse: unwrap<AdminBannerDto>,
      invalidatesTags: ["AdminBanner"],
    }),
    updateAdminBanner: builder.mutation<AdminBannerDto, { id: string; input: UpdateBannerInput }>({
      query: ({ id, input }) => ({ url: `/admin/banners/${id}`, method: "PATCH", body: input }),
      transformResponse: unwrap<AdminBannerDto>,
      invalidatesTags: ["AdminBanner"],
    }),
    deleteAdminBanner: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/banners/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["AdminBanner"],
    }),
  }),
});

export const {
  useGetAdminBannersQuery,
  useCreateAdminBannerMutation,
  useUpdateAdminBannerMutation,
  useDeleteAdminBannerMutation,
} = adminBannersApi;
