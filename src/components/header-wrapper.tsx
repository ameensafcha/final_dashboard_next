"use client";

import { usePathname } from "next/navigation";
import { NotificationCenter } from "@/components/notification-center";

export function HeaderWrapper() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3 flex justify-end items-center gap-4">
      <NotificationCenter />
    </header>
  );
}
