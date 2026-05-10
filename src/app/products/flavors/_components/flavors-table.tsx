"use client";

import { Sparkles, Edit, Trash2 } from "lucide-react";

interface Flavor {
  id: string;
  name: string;
  short_code: string;
  ingredients?: string | null;
  is_active: boolean;
}

interface FlavorsTableProps {
  flavors: Flavor[];
  onView: (flavor: Flavor) => void;
  onEdit: (flavor: Flavor) => void;
  onDelete: (flavor: Flavor) => void;
}

export function FlavorsTable({ flavors, onView, onEdit, onDelete }: FlavorsTableProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-md)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Name</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Short Code</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Ingredients</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Status</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flavors.length > 0 ? flavors.map((item, index) => (
            <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors" style={{ backgroundColor: index % 2 === 0 ? "transparent" : "var(--surface-container-low)" }}>
              <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.name}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>{item.short_code}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{item.ingredients || "—"}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-code-micro" style={{ backgroundColor: item.is_active ? "var(--success-bg)" : "var(--error-bg)", color: item.is_active ? "var(--success)" : "var(--error)" }}>
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onView(item)} className="px-3 py-1 rounded-[var(--radius-md)] text-label-sm font-medium cursor-pointer" style={{ color: "var(--accent-gold)", backgroundColor: "var(--surface-container-low)" }}>View</button>
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] cursor-pointer" style={{ color: "var(--accent-gold)" }}><Edit className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--error-bg)] cursor-pointer" style={{ color: "var(--error)" }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-12 h-12 opacity-30" style={{ color: "var(--accent-gold-muted)" }} />
                  <p className="font-medium" style={{ color: "var(--accent-gold-muted)" }}>No flavors found</p>
                  <p className="text-sm" style={{ color: "var(--accent-gold-muted)" }}>Add your first flavor</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
