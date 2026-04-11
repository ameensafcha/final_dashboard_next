"use client";

import Link from "next/link"; 
import { useAuth } from "@/contexts/auth-context";
import { Users, ShieldCheck, Settings as SettingsIcon, Loader2 } from "lucide-react";

export default function AdminPage() {
  const { role, isLoading } = useAuth();

  // White screen se bachne ke liye loader dikhayein
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Agar admin nahi hai toh unauthorized par bhej dein bajaye null ke
  if (role !== "admin") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p>Aapke paas is page ko dekhne ki permission nahi hai.</p>
      </div>
    );
  }

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
      title: "Settings",
      description: "Default raw material & system config",
      href: "/admin/settings",
      icon: SettingsIcon
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500">Manage your team and database-driven permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="p-6 bg-white border-2 border-slate-100 rounded-xl hover:border-amber-400 hover:bg-amber-50/30 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                <card.icon className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{card.title}</h2>
            </div>
            <p className="text-slate-500 text-sm">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}