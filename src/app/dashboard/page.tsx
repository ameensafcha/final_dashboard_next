"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function DashboardPage() {
  const { employee, role } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {employee?.name || "User"}!</h1>
        <p className="text-gray-600">Role: {role || "guest"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {role === "admin" && (
          <Link
            href="/admin"
            className="p-6 bg-amber-50 border-2 border-amber-400 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-amber-800">Admin Panel</h2>
            <p className="text-amber-600 text-sm mt-1">Manage employees and roles</p>
          </Link>
        )}

        <Link
          href="/tasks"
          className="p-6 bg-blue-50 border-2 border-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-blue-800">All Tasks</h2>
          <p className="text-blue-600 text-sm mt-1">View and manage all tasks</p>
        </Link>

        <Link
          href="/tasks/board"
          className="p-6 bg-green-50 border-2 border-green-400 rounded-lg hover:bg-green-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-green-800">Kanban Board</h2>
          <p className="text-green-600 text-sm mt-1">Drag and drop task management</p>
        </Link>

        <Link
          href="/tasks/my-tasks"
          className="p-6 bg-purple-50 border-2 border-purple-400 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-purple-800">My Tasks</h2>
          <p className="text-purple-600 text-sm mt-1">View your assigned tasks</p>
        </Link>
      </div>
    </div>
  );
}