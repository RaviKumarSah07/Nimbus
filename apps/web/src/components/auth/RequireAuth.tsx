"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "../../store/hooks";
import { Spinner } from "../ui/Spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "idle" || status === "loading") {
    return <Spinner label="Checking your session" />;
  }
  if (status === "guest") {
    return null;
  }

  return <>{children}</>;
}
