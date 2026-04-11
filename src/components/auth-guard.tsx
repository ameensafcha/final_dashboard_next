"use client";

import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Jab tak auth/DB se data fetch ho raha hai, spinner dikhayein
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div
          className="animate-spin w-8 h-8 border-4 border-gray-200 rounded-full"
          style={{ borderTopColor: "#E8C547" }}
        />
      </div>
    );
  }

  // Agar user null hai, toh kuch render mat karein. 
  // (Middleware automatically user ko /login par bhej chuka hoga, isliye yahan router.push ki zaroorat nahi hai)
  if (!user) return null;

  return <>{children}</>;
}