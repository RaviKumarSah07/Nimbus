import type { ApiResponse, PaginatedResult } from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { NotificationDto } from "../../lib/types-notification";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResult<NotificationDto> & { unreadCount: number }, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/notifications", params: { page: params?.page ?? 1, limit: params?.limit ?? 20 } }),
      transformResponse: unwrap<PaginatedResult<NotificationDto> & { unreadCount: number }>,
      providesTags: ["Notification"],
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => "/notifications/unread-count",
      transformResponse: (res: ApiResponse<{ count: number }>) => unwrap(res).count,
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      transformResponse: unwrap<{ ok: boolean }>,
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      transformResponse: unwrap<{ ok: boolean }>,
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
