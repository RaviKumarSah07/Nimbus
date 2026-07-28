import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "../../components/auth/AuthCard";
import { LoginForm } from "../../components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Log in to view your orders, wishlist, and saved addresses.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
