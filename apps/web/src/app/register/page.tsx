import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { RegisterForm } from "../../components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Save addresses, track orders, and check out faster next time.">
      <RegisterForm />
    </AuthCard>
  );
}
