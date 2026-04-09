import { requireAdmin } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin verification - this runs before any rendering
  const adminUser = await requireAdmin().catch(() => null);

  if (!adminUser) {
    // If requireAdmin() redirects, we won't reach here
    // But if it returns null (shouldn't happen with current implementation),
    // redirect to dashboard
    redirect("/dashboard");
  }

  // Render children - server component so no client-side flash
  return <>{children}</>;
}