"use client";

import { useState, type FormEvent } from "react";
import { useCreateAddressMutation, useUpdateAddressMutation } from "../../store/api/authApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { AddressDto } from "../../lib/types-auth";

interface AddressFormProps {
  initial?: AddressDto;
  onDone: () => void;
}

export function AddressForm({ initial, onDone }: AddressFormProps) {
  const [fields, setFields] = useState({
    label: initial?.label ?? "",
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    postalCode: initial?.postalCode ?? "",
    country: initial?.country ?? "US",
  });
  const [isDefaultShipping, setIsDefaultShipping] = useState(initial?.isDefaultShipping ?? false);
  const [isDefaultBilling, setIsDefaultBilling] = useState(initial?.isDefaultBilling ?? false);

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...fields, label: fields.label || undefined, line2: fields.line2 || undefined, isDefaultShipping, isDefaultBilling };
    if (initial) {
      await updateAddress({ id: initial.id, input: payload });
    } else {
      await createAddress(payload);
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-md bg-white shadow-card p-4 sm:grid-cols-2">
      <Input label="Label (optional)" value={fields.label} onChange={(e) => set("label", e.target.value)} placeholder="Home, Office..." />
      <Input label="Full name" value={fields.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      <Input label="Phone" value={fields.phone} onChange={(e) => set("phone", e.target.value)} required />
      <Input label="Country (2-letter code)" value={fields.country} onChange={(e) => set("country", e.target.value.toUpperCase())} required maxLength={2} />
      <Input className="sm:col-span-2" label="Address line 1" value={fields.line1} onChange={(e) => set("line1", e.target.value)} required />
      <Input className="sm:col-span-2" label="Address line 2 (optional)" value={fields.line2} onChange={(e) => set("line2", e.target.value)} />
      <Input label="City" value={fields.city} onChange={(e) => set("city", e.target.value)} required />
      <Input label="State" value={fields.state} onChange={(e) => set("state", e.target.value)} required />
      <Input label="Postal code" value={fields.postalCode} onChange={(e) => set("postalCode", e.target.value)} required />

      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isDefaultShipping} onChange={(e) => setIsDefaultShipping(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Set as default shipping address
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isDefaultBilling} onChange={(e) => setIsDefaultBilling(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Set as default billing address
        </label>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" isLoading={isCreating || isUpdating}>
          {initial ? "Save address" : "Add address"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
