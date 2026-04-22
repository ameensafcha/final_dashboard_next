"use client";

import { cn } from "@/lib/utils";

type TaskStatus = "not_started" | "in_progress" | "review" | "completed";

interface StatusBadgeProps {
  status: TaskStatus | string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  not_started: { bg: "bg-gray-100", text: "text-gray-700", label: "Not Started" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-800", label: "In Progress" },
  review: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Review" },
  completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
  active: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Active" },
  blocked: { bg: "bg-red-100", text: "text-red-800", label: "Blocked" },
  recurring: { bg: "bg-purple-100", text: "text-purple-800", label: "Recurring" },
  sop: { bg: "bg-indigo-100", text: "text-indigo-800", label: "SOP" },
  parked: { bg: "bg-slate-200", text: "text-slate-800", label: "Parked" },
  needs_verification: { bg: "bg-orange-100", text: "text-orange-800", label: "Needs Verification" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-1 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
