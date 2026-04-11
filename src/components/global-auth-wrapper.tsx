"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "./auth-guard";

export function GlobalAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") return <>{children}</>;

  return <AuthGuard>{children}</AuthGuard>;
}
