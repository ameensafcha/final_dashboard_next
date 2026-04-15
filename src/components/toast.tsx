"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  // Enforcing strict CSS variable usage for backgrounds
  const bgColors = {
    success: "bg-[var(--success-bg)]",
    error: "bg-[var(--error-bg)]",
    warning: "bg-[var(--warning-bg)]",
    info: "bg-[var(--info-bg)]",
  };

  // Enforcing strict CSS variable usage for icon accents
  const iconColors = {
    success: "text-[var(--success)]",
    error: "text-[var(--error)]",
    warning: "text-[var(--warning)]",
    info: "text-[var(--info)]",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-4 min-w-[300px] max-w-[400px]",
        "border-none outline-none", // Strict enforcement of the No-Line Rule
        "rounded-[var(--radius-md)]", // Enforcing minimum 24px roundness
        "shadow-[var(--shadow-lg)]", // Using the warm, diffused ambient shadow
        "animate-slide-up", // Utilizing the custom global.css animation
        bgColors[toast.type]
      )}
    >
      <span className={cn("shrink-0", iconColors[toast.type])}>
        {icons[toast.type]}
      </span>
      <p className="flex-1 font-[family-name:var(--font-body)] text-[length:var(--text-body)] font-[number:var(--text-body-weight)] text-[var(--foreground)]">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className={cn(
          "p-1.5 rounded-full cursor-pointer outline-none",
          "transition-all duration-[var(--transition-normal)]",
          "hover:bg-[var(--surface-container-highest)] hover:[transform:var(--hover-scale)]" // Applying the required physical hover scale
        )}
      >
        <X className="w-4 h-4 opacity-60 text-[var(--foreground)]" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[var(--spacing-xl)] right-[var(--spacing-xl)] z-50 flex flex-col gap-[var(--spacing-md)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}