"use client";

import Link from "next/link"; 
import { useAuth } from "@/contexts/auth-context";

export default function AdminPage() {
  const { role, isLoading } = useAuth();

  if (isLoading || role !== "admin") return null;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Admin Panel</h1>
        <p className="text-gray-600">Manage your team and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/employees"
          className="p-6 bg-amber-50 border-2 border-amber-400 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-amber-800">Employees</h2>
          <p className="text-amber-600 text-sm mt-1">Manage team members and roles</p>
        </Link>

        <div className="p-6 bg-gray-50 border-2 border-gray-300 rounded-lg opacity-60">
          <h2 className="text-lg font-semibold text-gray-800">Roles</h2>
          <p className="text-gray-500 text-sm mt-1">Coming soon</p>
        </div>

        <Link
          href="/admin/settings"
          className="p-6 bg-amber-50 border-2 border-amber-400 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-amber-800">Settings</h2>
          <p className="text-amber-600 text-sm mt-1">Default raw material & system config</p>
        </Link>
      </div>
    </div>
  );
}