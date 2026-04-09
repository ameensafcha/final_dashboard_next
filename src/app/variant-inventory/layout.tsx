import { AuthGuard } from "@/components/auth-guard";

export default function VariantInventoryLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
