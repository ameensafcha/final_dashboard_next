import { AuthGuard } from "@/components/auth-guard";

export default function PackingReceivesLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
