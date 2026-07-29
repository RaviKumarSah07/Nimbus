"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { useGetCartQuery } from "../../store/api/cartApi";
import { useListAddressesQuery } from "../../store/api/authApi";
import { useValidateCouponMutation } from "../../store/api/couponsApi";
import { useStartCheckoutMutation } from "../../store/api/checkoutApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../lib/formatCurrency";

export function CheckoutForm() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAuthed = authStatus === "authenticated";
  const { data: cart, isLoading: isCartLoading } = useGetCartQuery(undefined, { skip: authStatus === "idle" || authStatus === "loading" });
  const { data: savedAddresses } = useListAddressesQuery(undefined, { skip: !isAuthed });

  const [guestEmail, setGuestEmail] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  useEffect(() => {
    const defaultAddress = savedAddresses?.find((a) => a.isDefaultShipping) ?? savedAddresses?.[0];
    if (defaultAddress) {
      setAddress({
        fullName: defaultAddress.fullName,
        phone: defaultAddress.phone,
        line1: defaultAddress.line1,
        line2: defaultAddress.line2 ?? "",
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        country: defaultAddress.country,
      });
    }
  }, [savedAddresses]);

  const [couponCode, setCouponCode] = useState("");
  const [validateCoupon, { data: couponPreview, isLoading: isValidatingCoupon, error: couponError }] = useValidateCouponMutation();
  const [startCheckout, { isLoading: isSubmitting, error: checkoutError }] = useStartCheckoutMutation();
  const router = useRouter();

  function setField<K extends keyof typeof address>(key: K, value: string) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !cart) return;
    await validateCoupon({ code: couponCode.trim(), subtotal: cart.subtotal });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await startCheckout({
      shippingAddress: address,
      billingSameAsShipping: true,
      couponCode: couponPreview?.code,
      guestEmail: isAuthed ? undefined : guestEmail,
    }).unwrap();

    // Stripe (or our own success page, for the mock gateway) is a
    // different origin/full navigation, not an in-app route.
    window.location.href = result.checkoutUrl;
  }

  if (authStatus === "idle" || authStatus === "loading" || isCartLoading) {
    return <Spinner label="Loading checkout" />;
  }

  if (!cart || cart.items.length === 0) {
    return <p className="text-sm text-slate-600">Your cart is empty. Add something before checking out.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-6 lg:col-span-2">
        {!isAuthed && (
          <section className="rounded-md bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Contact</h2>
            <Input
              label="Email"
              type="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              hint="We'll send your order confirmation here. Creating an account isn't required."
            />
          </section>
        )}

        <section className="rounded-md bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Shipping address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Full name" value={address.fullName} onChange={(e) => setField("fullName", e.target.value)} required />
            <Input label="Phone" value={address.phone} onChange={(e) => setField("phone", e.target.value)} required />
            <Input className="sm:col-span-2" label="Address line 1" value={address.line1} onChange={(e) => setField("line1", e.target.value)} required />
            <Input className="sm:col-span-2" label="Address line 2 (optional)" value={address.line2} onChange={(e) => setField("line2", e.target.value)} />
            <Input label="City" value={address.city} onChange={(e) => setField("city", e.target.value)} required />
            <Input label="State" value={address.state} onChange={(e) => setField("state", e.target.value)} required />
            <Input label="Postal code" value={address.postalCode} onChange={(e) => setField("postalCode", e.target.value)} required />
            <Input
              label="Country (2-letter code)"
              value={address.country}
              onChange={(e) => setField("country", e.target.value.toUpperCase())}
              required
              maxLength={2}
            />
          </div>
        </section>

        <section className="rounded-md bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment</h2>
          <p className="text-sm text-slate-500">
            You&apos;ll be taken to a secure checkout to pay. This is a portfolio demo - no real payment is processed.
          </p>
        </section>

        {checkoutError && (
          <p role="alert" className="text-sm text-red-600">
            {"data" in checkoutError ? String((checkoutError.data as { error?: { message?: string } })?.error?.message ?? "Checkout failed") : "Checkout failed"}
          </p>
        )}

        <Button type="submit" variant="cta" size="lg" isLoading={isSubmitting} className="w-full lg:hidden">
          Place order
        </Button>
      </form>

      <aside className="h-fit rounded-md bg-white p-6 shadow-card">
        <h2 className="border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Order summary</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2 text-slate-600">
              <span className="line-clamp-1">
                {item.productName} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium text-slate-900">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleApplyCoupon} isLoading={isValidatingCoupon}>
            <Tag className="h-4 w-4" aria-hidden="true" /> Apply
          </Button>
        </div>
        {couponError && (
          <p className="mt-1 text-xs text-red-600">
            {"data" in couponError ? String((couponError.data as { error?: { message?: string } })?.error?.message ?? "Invalid coupon") : "Invalid coupon"}
          </p>
        )}
        {couponPreview && <p className="mt-1 text-xs text-emerald-600">Coupon applied: -{formatCurrency(couponPreview.discountAmount)}</p>}

        <dl className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(cart.subtotal)}</dd>
          </div>
          {couponPreview && (
            <div className="flex justify-between text-emerald-600">
              <dt>Discount</dt>
              <dd>-{formatCurrency(couponPreview.discountAmount)}</dd>
            </div>
          )}
          <p className="pt-1 text-xs text-slate-400">Shipping and tax are calculated and shown on your confirmation page.</p>
        </dl>

        <Button type="submit" form="checkout-form" variant="cta" size="lg" isLoading={isSubmitting} className="mt-4 hidden w-full lg:flex">
          Place order
        </Button>
      </aside>
    </div>
  );
}
