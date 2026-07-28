import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="Enter the email on your account and we'll send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
