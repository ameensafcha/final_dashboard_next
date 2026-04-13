import { AuthGuard } from "@/components/auth-guard";

export default function ReceivingLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
