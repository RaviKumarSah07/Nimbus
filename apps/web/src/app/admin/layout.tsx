import { Container } from "../../components/ui/Container";
import { RequireAdmin } from "../../components/auth/RequireAdmin";
import { AdminSidebar } from "../../components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin console</h1>
      <RequireAdmin>
        <div className="flex flex-col gap-8 lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 overflow-x-auto">{children}</div>
        </div>
      </RequireAdmin>
    </Container>
  );
}
