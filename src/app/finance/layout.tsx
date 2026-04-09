import { AuthGuard } from "@/components/auth-guard";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
