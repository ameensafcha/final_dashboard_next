"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F4EE" }}>
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
          Access Denied
        </h1>

        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd> to return to dashboard
        </p>
      </div>
    </main>
  );
}