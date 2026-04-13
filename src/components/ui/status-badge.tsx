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
