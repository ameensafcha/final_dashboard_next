import { AuthGuard } from "@/components/auth-guard";

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
