import type { PaginatedResult } from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { OrderDto } from "../../lib/types-order";

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOrders: builder.query<PaginatedResult<OrderDto>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/orders", params: { page: params?.page ?? 1, limit: params?.limit ?? 10 } }),
      transformResponse: unwrap<PaginatedResult<OrderDto>>,
      providesTags: (result) =>
        result ? [...result.items.map((o) => ({ type: "Order" as const, id: o.id })), { type: "Order" as const, id: "LIST" }] : [{ type: "Order", id: "LIST" }],
    }),
    getMyOrder: builder.query<OrderDto, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: unwrap<OrderDto>,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    getOrderConfirmation: builder.query<OrderDto, string>({
      query: (id) => `/orders/confirmation/${id}`,
      transformResponse: unwrap<OrderDto>,
      // Tagged so confirming the payment re-reads the receipt - without this
      // it would keep showing the PENDING snapshot it first loaded.
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation<OrderDto, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: "POST", body: { reason } }),
      transformResponse: unwrap<OrderDto>,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Order", id }, { type: "Order", id: "LIST" }],
    }),
    requestReturn: builder.mutation<{ id: string }, { orderId: string; orderItemId: string; reason: string }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/return`, method: "POST", body }),
      transformResponse: unwrap<{ id: string }>,
      invalidatesTags: (_result, _error, { orderId }) => [{ type: "Order", id: orderId }],
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  useGetMyOrderQuery,
  useGetOrderConfirmationQuery,
  useCancelOrderMutation,
  useRequestReturnMutation,
} = ordersApi;
