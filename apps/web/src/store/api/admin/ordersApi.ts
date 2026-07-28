import type { PaginatedResult, OrderStatus } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminOrderDto } from "../../../lib/types-admin";

export const adminOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOrders: builder.query<PaginatedResult<AdminOrderDto>, { page?: number; limit?: number; status?: OrderStatus }>({
      query: ({ page = 1, limit = 20, status }) => ({ url: "/admin/orders", params: { page, limit, status } }),
      transformResponse: unwrap<PaginatedResult<AdminOrderDto>>,
      providesTags: (result) =>
        result
          ? [...result.items.map((o) => ({ type: "AdminOrder" as const, id: o.id })), { type: "AdminOrder" as const, id: "LIST" }]
          : [{ type: "AdminOrder", id: "LIST" }],
    }),
    getAdminOrder: builder.query<AdminOrderDto, string>({
      query: (id) => `/admin/orders/${id}`,
      transformResponse: unwrap<AdminOrderDto>,
      providesTags: (_r, _e, id) => [{ type: "AdminOrder", id }],
    }),
    updateAdminOrderStatus: builder.mutation<AdminOrderDto, { id: string; status: OrderStatus; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/orders/${id}/status`, method: "PATCH", body }),
      transformResponse: unwrap<AdminOrderDto>,
      invalidatesTags: (_r, _e, { id }) => [{ type: "AdminOrder", id }, { type: "AdminOrder", id: "LIST" }, "AdminDashboard"],
    }),
    getAdminReturns: builder.query<
      { id: string; reason: string; status: string; order: { orderNumber: string }; orderItem: { nameSnapshot: string } }[],
      void
    >({
      query: () => "/admin/returns",
      transformResponse: unwrap,
      providesTags: ["AdminOrder"],
    }),
    updateAdminReturnStatus: builder.mutation<{ id: string }, { id: string; status: "APPROVED" | "REJECTED" | "COMPLETED" }>({
      query: ({ id, status }) => ({ url: `/admin/returns/${id}`, method: "PATCH", body: { status } }),
      transformResponse: unwrap,
      invalidatesTags: ["AdminOrder"],
    }),
  }),
});

export const {
  useGetAdminOrdersQuery,
  useGetAdminOrderQuery,
  useUpdateAdminOrderStatusMutation,
  useGetAdminReturnsQuery,
  useUpdateAdminReturnStatusMutation,
} = adminOrdersApi;
