"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "../../store/hooks";
import { Spinner } from "../ui/Spinner";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, user, router, pathname]);

  if (status === "idle" || status === "loading") {
    return <Spinner label="Checking your session" />;
  }
  if (status !== "authenticated" || user?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}
