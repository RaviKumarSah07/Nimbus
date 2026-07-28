import type { PaginatedResult } from "@ecommerce/shared";
import type { CreateProductInput, UpdateProductInput } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminProductDto, AdminBrandDto } from "../../../lib/types-admin";

export const adminProductsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProducts: builder.query<PaginatedResult<AdminProductDto>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({ url: "/admin/products", params: { page, limit } }),
      transformResponse: unwrap<PaginatedResult<AdminProductDto>>,
      providesTags: (result) =>
        result
          ? [...result.items.map((p) => ({ type: "AdminProduct" as const, id: p.id })), { type: "AdminProduct" as const, id: "LIST" }]
          : [{ type: "AdminProduct", id: "LIST" }],
    }),
    createAdminProduct: builder.mutation<AdminProductDto, CreateProductInput>({
      query: (body) => ({ url: "/admin/products", method: "POST", body }),
      transformResponse: unwrap<AdminProductDto>,
      invalidatesTags: [{ type: "AdminProduct", id: "LIST" }, "Product"],
    }),
    updateAdminProduct: builder.mutation<AdminProductDto, { id: string; input: UpdateProductInput }>({
      query: ({ id, input }) => ({ url: `/admin/products/${id}`, method: "PATCH", body: input }),
      transformResponse: unwrap<AdminProductDto>,
      invalidatesTags: (_r, _e, { id }) => [{ type: "AdminProduct", id }, { type: "AdminProduct", id: "LIST" }, "Product"],
    }),
    deleteAdminProduct: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: [{ type: "AdminProduct", id: "LIST" }, "Product"],
    }),
    getAdminBrands: builder.query<AdminBrandDto[], void>({
      query: () => "/admin/brands",
      transformResponse: unwrap<AdminBrandDto[]>,
      providesTags: ["Brand"],
    }),
    createAdminBrand: builder.mutation<AdminBrandDto, { name: string; slug: string }>({
      query: (body) => ({ url: "/admin/brands", method: "POST", body }),
      transformResponse: unwrap<AdminBrandDto>,
      invalidatesTags: ["Brand"],
    }),
  }),
});

export const {
  useGetAdminProductsQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
  useGetAdminBrandsQuery,
  useCreateAdminBrandMutation,
} = adminProductsApi;
