"use client";

import { X } from "lucide-react";

interface Flavor {
  id: string;
  name: string;
  short_code: string;
  ingredients?: string | null;
  is_active: boolean;
}

interface ViewFlavorDialogProps {
  flavor: Flavor | null;
  onClose: () => void;
}

export function ViewFlavorDialog({ flavor, onClose }: ViewFlavorDialogProps) {
  if (!flavor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--surface-container-low)" }}>
          <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{flavor.name}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-container-low)] transition-colors cursor-pointer">
            <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-code-micro" style={{ color: "var(--accent-gold-muted)", fontFamily: "var(--font-mono)" }}>{flavor.short_code}</span>
            <span className="px-3 py-1 rounded-full text-code-micro" style={{ backgroundColor: flavor.is_active ? "var(--success-bg)" : "var(--error-bg)", color: flavor.is_active ? "var(--success)" : "var(--error)" }}>
              {flavor.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div>
            <p className="text-code-micro mb-3" style={{ color: "var(--accent-gold-muted)" }}>Ingredients</p>
            {flavor.ingredients ? (
              <div className="flex flex-wrap gap-2">
                {flavor.ingredients.split(",").map((ing: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-[var(--radius-sm)] text-sm" style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)" }}>
                    {ing.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--accent-gold-muted)" }}>No ingredients added</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-6 py-2.5 rounded-[var(--radius-md)] font-semibold cursor-pointer transition-all hover:scale-[var(--hover-scale-sm)]" style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
