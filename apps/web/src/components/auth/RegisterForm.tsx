"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRegisterMutation } from "../../store/api/authApi";
import { useHandleAuthSuccess } from "./useHandleAuthSuccess";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading, error }] = useRegisterMutation();
  const handleAuthSuccess = useHandleAuthSuccess();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = await register({ name, email, password }).unwrap();
      await handleAuthSuccess(payload);
    } catch {
      // error state below is already derived from the mutation
    }
  }

  const fieldErrors = (error && "data" in error ? (error.data as { error?: { fields?: { path: string; message: string }[] } })?.error?.fields : undefined) ?? [];
  const generalError =
    error && "data" in error && !fieldErrors.length
      ? String((error.data as { error?: { message?: string } })?.error?.message ?? "Registration failed")
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with an uppercase letter and a number."
        error={fieldErrors.find((f) => f.path === "password")?.message}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {generalError && (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Create account
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
