"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPasswordMutation } from "../../store/api/authApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [resetPassword, { isLoading, error, isSuccess }] = useResetPasswordMutation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await resetPassword({ token, password }).unwrap().catch(() => undefined);
  }

  if (!token) {
    return <p className="text-sm text-red-600">This reset link is missing its token. Please request a new one.</p>;
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">Your password has been reset.</p>
        <Button onClick={() => router.push("/login")} className="w-full">
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with an uppercase letter and a number."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {"data" in error ? String((error.data as { error?: { message?: string } })?.error?.message ?? "Reset failed") : "Reset failed"}
        </p>
      )}
      <Button type="submit" isLoading={isLoading} className="w-full">
        Reset password
      </Button>
    </form>
  );
}
