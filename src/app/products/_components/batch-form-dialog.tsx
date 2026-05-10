"use client";

import { X, Loader2 } from "lucide-react";
import { type Variant } from "./types";
import { PACKAGING_STATES, LOCATIONS } from "@/lib/sku";

interface BatchForm {
  quantity: string;
  manufacturing_date: string;
  expiry_date: string;
  packaging_state: string;
  location: string;
  notes: string;
}

interface BatchFormDialogProps {
  open: boolean;
  selectedVariantForBatch: Variant | null;
  batchForm: BatchForm;
  editingBatch: { id: string } | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFieldChange: (field: keyof BatchForm, value: string) => void;
}

export function BatchFormDialog({
  open,
  selectedVariantForBatch,
  batchForm,
  editingBatch,
  isPending,
  onClose,
  onSubmit,
  onFieldChange,
}: BatchFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
          <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{editingBatch ? "Edit Batch" : "Log New Batch"}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {selectedVariantForBatch && (
            <div className="p-3 rounded-xl bg-[#FBFBF7] border flex items-center justify-between" style={{ borderColor: "#F5F4EE" }}>
              <span className="text-xs font-mono font-bold text-[#C9A83A]">{selectedVariantForBatch.sku}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedVariantForBatch.size.size}{selectedVariantForBatch.size.unit}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={batchForm.quantity}
                  onChange={(e) => onFieldChange("quantity", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Packaging State</label>
                <select
                  value={batchForm.packaging_state}
                  onChange={(e) => onFieldChange("packaging_state", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold bg-white focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                >
                  {PACKAGING_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Manufacturing Date</label>
                <input
                  type="date"
                  value={batchForm.manufacturing_date}
                  onChange={(e) => onFieldChange("manufacturing_date", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Expiry Date</label>
                <input
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(e) => onFieldChange("expiry_date", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Location</label>
                <select
                  value={batchForm.location}
                  onChange={(e) => onFieldChange("location", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold bg-white focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                >
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Notes</label>
                <input
                  type="text"
                  value={batchForm.notes}
                  onChange={(e) => onFieldChange("notes", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none"
                  style={{ borderColor: "#E8E7E1" }}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#F97316" }}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBatch ? "Update Batch" : "Log Batch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
