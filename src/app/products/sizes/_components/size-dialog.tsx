"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SizeFormData {
  size: string;
  unit: string;
  pack_type: string;
  is_active: boolean;
}

interface SizeDialogProps {
  open: boolean;
  editSize: { id: string } | null;
  formData: SizeFormData;
  isPending: boolean;
  onClose: () => void;
  onChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SizeDialog({ open, editSize, formData, isPending, onClose, onChange, onSubmit }: SizeDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E8C54720" }}>
          <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{editSize ? "Edit Size" : "Add Size"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-md" aria-label="Close">✕</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Size</label>
                <Input type="number" value={formData.size} onChange={(e) => onChange("size", e.target.value)} placeholder="e.g., 1, 500, 100" required style={{ borderColor: "#E8C54720" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Unit</label>
                <select value={formData.unit} onChange={(e) => onChange("unit", e.target.value)} className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:border-transparent transition-all" style={{ borderColor: "#E8C54720", color: "#1A1A1A", backgroundColor: "#FFFFFF" }}>
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Pack Type</label>
              <Input type="text" value={formData.pack_type} onChange={(e) => onChange("pack_type", e.target.value)} placeholder="e.g., Bottle, Box, Pouch" required style={{ borderColor: "#E8C54720" }} />
            </div>
            {editSize && (
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Status</label>
                <button type="button" onClick={() => onChange("is_active", !formData.is_active)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: formData.is_active ? "#E8C547" : "#DC2626" }}>
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: formData.is_active ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4 mt-4 border-t" style={{ borderColor: "#E8C54720" }}>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>Cancel</Button>
              <Button type="submit" disabled={isPending} style={{ backgroundColor: "#E8C547", color: "white" }} className="hover:opacity-90">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
