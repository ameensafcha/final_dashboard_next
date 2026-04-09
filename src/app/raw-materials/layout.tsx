import { AuthGuard } from "@/components/auth-guard";

export default function RawMaterialsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
