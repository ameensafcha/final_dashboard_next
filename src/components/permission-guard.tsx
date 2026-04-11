"use client";
import { useAuth } from "@/contexts/auth-context";

export function PermissionGuard({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { isAdmin, permissions } = useAuth();

  const hasAccess = isAdmin || permissions.includes(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  return null;
}