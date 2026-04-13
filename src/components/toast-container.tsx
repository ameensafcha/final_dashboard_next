"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/stores";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function ToastItem({ id, type, message, onRemove }: { 
  id: string; 
  type: "success" | "error" | "warning" | "info"; 
  message: string;
  onRemove: (id: string) => void;
}) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type];

  const colors = {
    success: "bg-green-50 border-green-500 text-green-800",
    error: "bg-red-50 border-red-500 text-red-800",
    warning: "bg-amber-50 border-amber-500 text-amber-800",
    info: "bg-blue-50 border-blue-500 text-blue-800",
  };

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg min-w-[300px] max-w-[400px] animate-in slide-in-from-right",
        colors[type]
      )}
    >
      <Icon className={cn("w-5 h-5", iconColors[type])} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="p-1 hover:bg-black/5 rounded transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}
