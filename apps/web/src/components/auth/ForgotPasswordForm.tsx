"use client";

import { useState, type FormEvent } from "react";
import { useForgotPasswordMutation } from "../../store/api/authApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await forgotPassword({ email });
  }

  if (isSuccess) {
    return (
      <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
        If that email is registered, a reset link has been sent. Check your inbox (or the server console log in this demo, since
        outbound email isn&apos;t wired to a real provider).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" isLoading={isLoading} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
