"use client";

import { Loader2 } from "lucide-react";
import { type Flavor } from "./types";

interface ProductFormContentProps {
  formData: {
    name: string;
    description: string;
    is_active: boolean;
    flavor_ids: string[];
  };
  flavors: Flavor[] | undefined;
  editMode: boolean;
  isPending: boolean;
  onFieldChange: (field: string, value: string | boolean | string[]) => void;
  onFlavorToggle: (flavorId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function ProductFormContent({
  formData,
  flavors,
  editMode,
  isPending,
  onFieldChange,
  onFlavorToggle,
  onSubmit,
  onCancel,
}: ProductFormContentProps) {
  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="e.g., Fruit Powder"
            required
            className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-[#E8C54720] outline-none transition-all"
            style={{ borderColor: "#E8E7E1" }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Flavors *</label>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-auto p-1 scrollbar-hide">
            {(flavors || []).map((f: Flavor) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFlavorToggle(f.id)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all cursor-pointer border relative"
                style={{
                  backgroundColor: formData.flavor_ids.includes(f.id) ? "#E8C54720" : "white",
                  color: formData.flavor_ids.includes(f.id) ? "#E8C547" : "#1A1A1A",
                  borderColor: formData.flavor_ids.includes(f.id) ? "#E8C547" : "#E8E7E1"
                }}
              >
                <span className="truncate block pr-4">{f.name}</span>
                {formData.flavor_ids.includes(f.id) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                )}
              </button>
            ))}
          </div>
          {formData.flavor_ids.length === 0 && (
            <p className="text-[10px] font-bold uppercase tracking-wider ml-1 text-red-500">Select at least one flavor</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onFieldChange("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-[#E8C54720] outline-none transition-all"
            style={{ borderColor: "#E8E7E1" }}
            placeholder="Optional product description..."
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-[#1A1A1A]">Product Status</label>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg" style={{ backgroundColor: formData.is_active ? "#DCFCE7" : "#FEE2E2", color: formData.is_active ? "#16A34A" : "#DC2626" }}>{formData.is_active ? "Active" : "Inactive"}</span>
          </div>
          <button
            type="button"
            onClick={() => onFieldChange("is_active", !formData.is_active)}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shadow-inner"
            style={{ backgroundColor: formData.is_active ? "#E8C547" : "#E5E7EB" }}
          >
            <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm" style={{ transform: formData.is_active ? "translateX(24px)" : "translateX(4px)" }} />
          </button>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button
            type="submit"
            disabled={isPending}
            className="px-10 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#E8C547" }}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {editMode ? "Save Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
