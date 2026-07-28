"use client";

import { useState } from "react";
import type { Role } from "@ecommerce/shared";
import { useGetAdminUsersQuery, useUpdateAdminUserRoleMutation, useUpdateAdminUserStatusMutation } from "../../store/api/admin/usersApi";
import { useAppSelector } from "../../store/hooks";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

export function UserTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminUsersQuery({ page, limit: 20 });
  const [updateRole] = useUpdateAdminUserRoleMutation();
  const [updateStatus] = useUpdateAdminUserStatusMutation();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  if (isLoading || !data) return <Spinner label="Loading users" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="border-b border-slate-50 last:border-none">
                  <td className="px-4 py-2 text-slate-800">{user.name}</td>
                  <td className="px-4 py-2 text-slate-500">{user.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={user.role}
                      disabled={isSelf}
                      onChange={(e) => updateRole({ id: user.id, role: e.target.value as Role })}
                      className="h-8 rounded-lg border border-slate-300 px-2 text-xs disabled:opacity-50"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{user._count.orders}</td>
                  <td className="px-4 py-2">
                    <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Deactivated"}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSelf}
                      onClick={() => updateStatus({ id: user.id, isActive: !user.isActive })}
                    >
                      {user.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-slate-500">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
