import type { CreateCategoryInput, UpdateCategoryInput } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminCategoryDto } from "../../../lib/types-admin";

export const adminCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminCategories: builder.query<AdminCategoryDto[], void>({
      query: () => "/admin/categories",
      transformResponse: unwrap<AdminCategoryDto[]>,
      providesTags: ["AdminCategory"],
    }),
    createAdminCategory: builder.mutation<AdminCategoryDto, CreateCategoryInput>({
      query: (body) => ({ url: "/admin/categories", method: "POST", body }),
      transformResponse: unwrap<AdminCategoryDto>,
      invalidatesTags: ["AdminCategory", "Category"],
    }),
    updateAdminCategory: builder.mutation<AdminCategoryDto, { id: string; input: UpdateCategoryInput }>({
      query: ({ id, input }) => ({ url: `/admin/categories/${id}`, method: "PATCH", body: input }),
      transformResponse: unwrap<AdminCategoryDto>,
      invalidatesTags: ["AdminCategory", "Category"],
    }),
    deleteAdminCategory: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["AdminCategory", "Category"],
    }),
  }),
});

export const {
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
} = adminCategoriesApi;
