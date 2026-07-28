import type { PaginatedResult, Role } from "@ecommerce/shared";
import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { AdminUserDto } from "../../../lib/types-admin";

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<PaginatedResult<AdminUserDto>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({ url: "/admin/users", params: { page, limit } }),
      transformResponse: unwrap<PaginatedResult<AdminUserDto>>,
      providesTags: (result) =>
        result
          ? [...result.items.map((u) => ({ type: "AdminUser" as const, id: u.id })), { type: "AdminUser" as const, id: "LIST" }]
          : [{ type: "AdminUser", id: "LIST" }],
    }),
    updateAdminUserRole: builder.mutation<AdminUserDto, { id: string; role: Role }>({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: "PATCH", body: { role } }),
      transformResponse: unwrap<AdminUserDto>,
      invalidatesTags: [{ type: "AdminUser", id: "LIST" }],
    }),
    updateAdminUserStatus: builder.mutation<AdminUserDto, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/users/${id}/status`, method: "PATCH", body: { isActive } }),
      transformResponse: unwrap<AdminUserDto>,
      invalidatesTags: [{ type: "AdminUser", id: "LIST" }],
    }),
  }),
});

export const { useGetAdminUsersQuery, useUpdateAdminUserRoleMutation, useUpdateAdminUserStatusMutation } = adminUsersApi;
