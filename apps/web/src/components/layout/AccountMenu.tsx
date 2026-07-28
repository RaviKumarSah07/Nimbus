"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Package, Heart, MapPin, LayoutDashboard } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLogoutMutation } from "../../store/api/authApi";
import { clearCredentials } from "../../store/authSlice";

export function AccountMenu() {
  const { user, status } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearCredentials());
      router.push("/");
      router.refresh();
    }
  }

  if (status === "idle" || status === "loading") {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-white/20" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href="/login" className="rounded-md px-3 py-2 font-semibold text-white hover:bg-white/10">
          Log in
        </Link>
        <Link href="/register" className="rounded-md bg-white px-4 py-2 font-semibold text-brand-700 hover:bg-brand-50">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        {user.name.split(" ")[0]}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <Link href="/account" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <User className="h-4 w-4" aria-hidden="true" /> My profile
          </Link>
          <Link href="/account/orders" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Package className="h-4 w-4" aria-hidden="true" /> Orders
          </Link>
          <Link href="/account/wishlist" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Heart className="h-4 w-4" aria-hidden="true" /> Wishlist
          </Link>
          <Link href="/account/addresses" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Addresses
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Admin dashboard
            </Link>
          )}
          <hr className="my-1 border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
