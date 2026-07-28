import { Container } from "../../components/ui/Container";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { AccountNav } from "../../components/account/AccountNav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">My account</h1>
      <RequireAuth>
        <div className="flex flex-col gap-8 lg:flex-row">
          <AccountNav />
          <div className="flex-1">{children}</div>
        </div>
      </RequireAuth>
    </Container>
  );
}
