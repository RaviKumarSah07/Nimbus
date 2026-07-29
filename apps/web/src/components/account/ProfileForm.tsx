"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAppSelector } from "../../store/hooks";
import { useUpdateProfileMutation, useChangePasswordMutation } from "../../store/api/authApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ProfileForm() {
  const user = useAppSelector((state) => state.auth.user);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [updateProfile, { isLoading: isSavingProfile, isSuccess: profileSaved }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    await updateProfile({ name, phone: phone || undefined });
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassword, { isLoading: isChangingPassword, isSuccess: passwordChanged, error: passwordError }] = useChangePasswordMutation();

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      // surfaced via passwordError below
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-md bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 grid max-w-md gap-4">
          <Input label="Email" value={user.email} disabled />
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" isLoading={isSavingProfile} className="w-fit">
            Save changes
          </Button>
          {profileSaved && <p className="text-sm text-emerald-600">Saved.</p>}
        </form>
      </section>

      <section className="rounded-md bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 grid max-w-md gap-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with an uppercase letter and a number."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {passwordError && (
            <p role="alert" className="text-sm text-red-600">
              {"data" in passwordError ? String((passwordError.data as { error?: { message?: string } })?.error?.message ?? "Could not change password") : "Could not change password"}
            </p>
          )}
          <Button type="submit" isLoading={isChangingPassword} className="w-fit">
            Update password
          </Button>
          {passwordChanged && <p className="text-sm text-emerald-600">Password updated. You&apos;ll need to log in again on other devices.</p>}
        </form>
      </section>
    </div>
  );
}
