import Link from "next/link";
import { Users, ShieldCheck, Settings as SettingsIcon, Building2 } from "lucide-react";

export default function AdminPage() {
  const adminCards = [
    {
      title: "Employees",
      description: "Manage team members and their status",
      href: "/admin/employees",
      icon: Users
    },
    {
      title: "Roles & Permissions",
      description: "Configure system roles and DB permissions",
      href: "/admin/roles",
      icon: ShieldCheck
    },
    {
      title: "Companies",
      description: "Manage companies for task association",
      href: "/admin/companies",
      icon: Building2
    },
    {
      title: "Settings",
      description: "Default raw material & system config",
      href: "/admin/settings",
      icon: SettingsIcon
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-[var(--surface)]">
      <div className="mb-8">
        <h1 className="text-section font-display text-[var(--foreground)]">
          Admin Panel
        </h1>
        <p className="text-body-light mt-1 text-[var(--muted-foreground)]">
          Manage your team and database-driven permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-card p-8 hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--primary-container)] transition-colors">
                <card.icon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">{card.title}</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}