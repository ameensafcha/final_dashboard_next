"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F5F4EE]">
        <div
          className="animate-spin w-8 h-8 border-4 border-gray-200 rounded-full"
          style={{ borderTopColor: "#E8C547" }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
