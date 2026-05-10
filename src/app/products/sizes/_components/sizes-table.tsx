"use client";

import { Ruler, Edit, Trash2 } from "lucide-react";

interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
  is_active: boolean;
}

interface SizesTableProps {
  sizes: Size[];
  onEdit: (size: Size) => void;
  onDelete: (size: Size) => void;
  onToggle: (size: Size) => void;
}

export function SizesTable({ sizes, onEdit, onDelete, onToggle }: SizesTableProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-md)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Size</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Unit</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Pack Type</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Status</th>
            <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sizes.length > 0 ? sizes.map((item, index) => (
            <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors" style={{ backgroundColor: index % 2 === 0 ? "transparent" : "var(--surface-container-low)" }}>
              <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.size}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{item.unit}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{item.pack_type}</td>
              <td className="px-4 py-3">
                <button onClick={() => onToggle(item)} className="px-2 py-1 rounded-full text-code-micro cursor-pointer hover:opacity-80" style={{ backgroundColor: item.is_active ? "var(--success-bg)" : "var(--error-bg)", color: item.is_active ? "var(--success)" : "var(--error)" }}>
                  {item.is_active ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] cursor-pointer" style={{ color: "var(--accent-gold)" }}><Edit className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--error-bg)] cursor-pointer" style={{ color: "var(--error)" }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Ruler className="w-12 h-12 opacity-30" style={{ color: "var(--accent-gold-muted)" }} />
                  <p className="font-medium" style={{ color: "var(--accent-gold-muted)" }}>No sizes found</p>
                  <p className="text-sm" style={{ color: "var(--accent-gold-muted)" }}>Add your first size</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
