"use client";

import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "urgent";

interface PriorityBadgeProps {
  priority: Priority | string;
  className?: string;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-700", label: "Low" },
  medium: { bg: "bg-amber-100", text: "text-amber-800", label: "Medium" },
  high: { bg: "bg-orange-100", text: "text-orange-800", label: "High" },
  urgent: { bg: "bg-red-100", text: "text-red-800", label: "Urgent" },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { bg: "bg-gray-100", text: "text-gray-700", label: priority };

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