import { getCurrentUser } from "@/lib/auth";
import AreasClient from "./areas-client";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-8 min-h-screen bg-[var(--surface)]">
      <AreasClient />
    </div>
  );
}