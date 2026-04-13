import { AuthGuard } from "@/components/auth-guard";

export default function PackingLogsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
