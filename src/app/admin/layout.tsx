"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--surface)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-[var(--primary-container)]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
