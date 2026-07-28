"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLoginMutation } from "../../store/api/authApi";
import { useHandleAuthSuccess } from "./useHandleAuthSuccess";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const handleAuthSuccess = useHandleAuthSuccess();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = await login({ email, password }).unwrap();
      await handleAuthSuccess(payload, redirectTo);
    } catch {
      // error state below is already derived from the mutation
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {"data" in error ? String((error.data as { error?: { message?: string } })?.error?.message ?? "Login failed") : "Login failed"}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Log in
      </Button>

      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
