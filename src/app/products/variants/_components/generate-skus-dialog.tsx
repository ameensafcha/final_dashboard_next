"use client";

import { X, Loader2, CheckCircle } from "lucide-react";
import { type GenerateFormData, type Product } from "./types";
import { GRADES } from "@/lib/sku";

interface AvailableFlavor {
  id: string;
  name: string;
  short_code: string;
  is_generated: boolean;
}

interface AvailableSize {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
  is_generated: boolean;
}

interface AvailableData {
  flavors: AvailableFlavor[];
  sizes: AvailableSize[];
  stats: { can_generate: number; already_generated: number };
}

interface GenerateSkusDialogProps {
  open: boolean;
  generateData: GenerateFormData;
  products: Product[] | undefined;
  availableData: AvailableData | undefined;
  isPending: boolean;
  onClose: () => void;
  onChange: (data: GenerateFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GenerateSkusDialog({
  open,
  generateData,
  products,
  availableData,
  isPending,
  onClose,
  onChange,
  onSubmit,
}: GenerateSkusDialogProps) {
  if (!open) return null;

  const filteredFlavors = availableData?.flavors || [];
  const filteredSizes = availableData?.sizes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
          <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Generate SKUs</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 scrollbar-hide">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Product *</label>
              <select
                value={generateData.product_id}
                onChange={(e) => onChange({ ...generateData, product_id: e.target.value, flavor_ids: [], size_ids: [] })}
                required
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm"
                style={{ borderColor: "#E8E7E1" }}
              >
                <option value="">Select Product</option>
                {(products || []).map((p: Product) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Grade *</label>
              <div className="flex gap-2 p-1 bg-[#F5F4EE] rounded-xl">
                {GRADES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => onChange({ ...generateData, grade: g.value, flavor_ids: [], size_ids: [] })}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                    style={{
                      backgroundColor: generateData.grade === g.value ? (g.value === "500M" ? "#7C3AED" : "#2563EB") : "transparent",
                      color: generateData.grade === g.value ? "white" : "#666",
                      boxShadow: generateData.grade === g.value ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {generateData.product_id && availableData && (
              <>
                <div className="p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: "#FBFBF7", border: "1px solid #F5F4EE" }}>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold" style={{ color: "#C9A83A" }}>Available for {generateData.grade}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "#1A1A1A" }}>Can generate: <span style={{ color: "#16A34A" }}>{availableData.stats.can_generate} new</span></p>
                  </div>
                  <div className="text-right text-xs font-bold" style={{ color: "#666" }}>
                    {availableData.stats.already_generated} existing
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Select Flavors *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredFlavors.map((flavor: AvailableFlavor) => (
                      <button
                        key={flavor.id}
                        type="button"
                        onClick={() => !flavor.is_generated && onChange({
                          ...generateData,
                          flavor_ids: generateData.flavor_ids.includes(flavor.id)
                            ? generateData.flavor_ids.filter((id) => id !== flavor.id)
                            : [...generateData.flavor_ids, flavor.id]
                        })}
                        disabled={flavor.is_generated}
                        className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all relative border"
                        style={{
                          backgroundColor: generateData.flavor_ids.includes(flavor.id) ? "#E8C54720" : flavor.is_generated ? "#F5F5F5" : "white",
                          borderColor: generateData.flavor_ids.includes(flavor.id) ? "#E8C547" : "#E8E7E1",
                          color: generateData.flavor_ids.includes(flavor.id) ? "#E8C547" : flavor.is_generated ? "#9CA3AF" : "#1A1A1A",
                          opacity: flavor.is_generated ? 0.6 : 1,
                          cursor: flavor.is_generated ? "not-allowed" : "pointer",
                        }}
                      >
                        <span className="truncate pr-4 block">{flavor.name}</span>
                        {flavor.is_generated && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
                        {!flavor.is_generated && generateData.flavor_ids.includes(flavor.id) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Select Sizes *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredSizes.map((size: AvailableSize) => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => !size.is_generated && onChange({
                          ...generateData,
                          size_ids: generateData.size_ids.includes(size.id)
                            ? generateData.size_ids.filter((id) => id !== size.id)
                            : [...generateData.size_ids, size.id]
                        })}
                        disabled={size.is_generated}
                        className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all relative border"
                        style={{
                          backgroundColor: generateData.size_ids.includes(size.id) ? "#E8C54720" : size.is_generated ? "#F5F5F5" : "white",
                          borderColor: generateData.size_ids.includes(size.id) ? "#E8C547" : "#E8E7E1",
                          color: generateData.size_ids.includes(size.id) ? "#E8C547" : size.is_generated ? "#9CA3AF" : "#1A1A1A",
                          opacity: size.is_generated ? 0.6 : 1,
                          cursor: size.is_generated ? "not-allowed" : "pointer",
                        }}
                      >
                        <span className="truncate pr-4 block">{size.size}{size.unit}</span>
                        <span className="block text-[10px] uppercase opacity-60">{size.pack_type}</span>
                        {size.is_generated && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
                        {!size.is_generated && generateData.size_ids.includes(size.id) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {generateData.flavor_ids.length > 0 && generateData.size_ids.length > 0 && (
                  <div className="p-4 rounded-2xl space-y-2 border" style={{ backgroundColor: "#FBFBF7", borderColor: "#F5F4EE" }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A83A" }}>Preview ({generateData.flavor_ids.length * generateData.size_ids.length} SKUs):</p>
                    <div className="max-h-32 overflow-auto font-mono text-[11px] space-y-1 scrollbar-hide">
                      {filteredFlavors
                        .filter((f: AvailableFlavor) => generateData.flavor_ids.includes(f.id))
                        .flatMap((f: AvailableFlavor) =>
                          filteredSizes
                            .filter((s: AvailableSize) => generateData.size_ids.includes(s.id))
                            .map((s: AvailableSize) => (
                              <p key={`${f.id}-${s.id}`} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                                SAF-{generateData.grade}-{f.short_code}-{s.size}
                              </p>
                            ))
                        )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button
                type="submit"
                disabled={isPending || generateData.flavor_ids.length === 0 || generateData.size_ids.length === 0}
                className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#E8C547" }}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Generating..." : `Generate ${generateData.flavor_ids.length * generateData.size_ids.length} SKUs`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
