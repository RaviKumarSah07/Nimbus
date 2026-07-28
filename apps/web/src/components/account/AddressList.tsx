"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { useListAddressesQuery, useDeleteAddressMutation } from "../../store/api/authApi";
import { AddressForm } from "./AddressForm";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import type { AddressDto } from "../../lib/types-auth";

export function AddressList() {
  const { data: addresses, isLoading } = useListAddressesQuery();
  const [deleteAddress] = useDeleteAddressMutation();
  const [editing, setEditing] = useState<AddressDto | "new" | null>(null);

  if (isLoading) return <Spinner label="Loading addresses" />;

  if (editing) {
    return <AddressForm initial={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses yet" description="Add one to speed up checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  {address.label && <p className="text-sm font-semibold text-slate-900">{address.label}</p>}
                  <p className="text-sm text-slate-700">{address.fullName}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing(address)} aria-label="Edit address" className="text-slate-400 hover:text-slate-700">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAddress(address.id)}
                    aria-label="Delete address"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country} · {address.phone}
              </p>
              <div className="mt-3 flex gap-2">
                {address.isDefaultShipping && <Badge tone="brand">Default shipping</Badge>}
                {address.isDefaultBilling && <Badge tone="neutral">Default billing</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
