import { baseApi } from "../baseApi";
import { unwrap } from "../unwrap";
import type { DashboardStatsDto } from "../../../lib/types-admin";

export const adminDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<DashboardStatsDto, void>({
      query: () => "/admin/dashboard",
      transformResponse: unwrap<DashboardStatsDto>,
      providesTags: ["AdminDashboard"],
    }),
  }),
});

export const { useGetAdminDashboardQuery } = adminDashboardApi;
