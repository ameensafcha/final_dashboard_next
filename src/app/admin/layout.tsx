"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading, user, employee, authError, retryAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && authError) {
      router.push("/login");
    }
  }, [isLoading, authError, router]);

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

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600">{authError}</p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-600">Unable to load user data</p>
        <button
          onClick={retryAuth}
          className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400"
        >
          Retry
        </button>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  return <>{children}</>;
}