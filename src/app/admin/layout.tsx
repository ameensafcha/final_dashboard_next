import { redirect } from "next/navigation";
import { checkRoutePermission } from "@/lib/auth-rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ Yahan check karo, kyunki ye Edge nahi, Node.js environment hai
  const { allowed } = await checkRoutePermission("/admin");

  if (!allowed) {
    redirect("/unauthorized"); // Ya forbidden page
  }

  return <>{children}</>;
}