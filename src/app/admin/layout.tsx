"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading, user, employee } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && employee && role !== "admin") {
      router.push("/dashboard");
    }
  }, [role, isLoading, user, employee, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  // Wait for employee data to load before checking role
  if (!employee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  // Don't render anything if not admin (redirect will happen in useEffect)
  if (role !== "admin") {
    return null;
  }

  return <>{children}</>;
}