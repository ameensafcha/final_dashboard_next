import { AuthGuard } from "@/components/auth-guard";

export default function FinishedProductsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
