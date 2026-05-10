"use client";

import { Loader2 } from "lucide-react";
import { type VariantFormData, type Variant, type Product, type Flavor, type Size } from "./types";
import { GRADES } from "@/lib/sku";

interface VariantFormContentProps {
  formData: VariantFormData;
  products: Product[] | undefined;
  flavors: Flavor[] | undefined;
  sizes: Size[] | undefined;
  editMode: boolean;
  isPending: boolean;
  onFieldChange: (field: string, value: string | boolean | number | null) => void;
  onUpdateSKU: (updates: Partial<VariantFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function VariantFormContent({
  formData,
  products,
  flavors,
  sizes,
  editMode,
  isPending,
  onFieldChange,
  onUpdateSKU,
  onSubmit,
  onCancel,
}: VariantFormContentProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!editMode && (
        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Product *</label>
          <select
            value={formData.product_id}
            onChange={(e) => onUpdateSKU({ product_id: e.target.value, flavor_id: "", size_id: "", sku: "" })}
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
      )}

      {!editMode && (
        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Grade *</label>
          <div className="flex gap-2 p-1 bg-[#F5F4EE] rounded-xl">
            {GRADES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => onUpdateSKU({ grade: g.value })}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: formData.grade === g.value ? (g.value === "500M" ? "#7C3AED" : "#2563EB") : "transparent",
                  color: formData.grade === g.value ? "white" : "#666",
                  boxShadow: formData.grade === g.value ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!editMode && (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Flavor *</label>
            <select
              value={formData.flavor_id}
              onChange={(e) => onUpdateSKU({ flavor_id: e.target.value, size_id: "", sku: "" })}
              required
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm disabled:bg-[#F5F4EE] disabled:cursor-not-allowed"
              style={{ borderColor: "#E8E7E1" }}
              disabled={!formData.product_id}
            >
              <option value="">{formData.product_id ? "Select Flavor" : "Select Product First"}</option>
              {(() => {
                const selectedProduct = (products || []).find((p: Product) => p.id === formData.product_id);
                if (!selectedProduct) return null;
                const allowedFlavorIds = selectedProduct.product_flavors.map((pf) => pf.flavor.id);
                return (flavors || [])
                  .filter((f: Flavor) => allowedFlavorIds.includes(f.id))
                  .map((f: Flavor) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.short_code})</option>
                  ));
              })()}
            </select>
          </div>
        )}

        {!editMode && (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Size *</label>
            <select
              value={formData.size_id}
              onChange={(e) => onUpdateSKU({ size_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm disabled:bg-[#F5F4EE] disabled:cursor-not-allowed"
              style={{ borderColor: "#E8E7E1" }}
              disabled={!formData.flavor_id}
            >
              <option value="">{formData.flavor_id ? "Select Size" : "Select Flavor First"}</option>
              {(() => {
                const selectedProduct = (products || []).find((p: Product) => p.id === formData.product_id);
                if (!selectedProduct) return null;
                const existingSizeIds = selectedProduct.variants
                  ?.filter((v: Variant) => v.flavor_id === formData.flavor_id && v.grade === formData.grade)
                  .map((v: Variant) => v.size_id) || [];
                return (sizes || [])
                  .filter((s: Size) => s.is_active && !existingSizeIds.includes(s.id))
                  .map((s: Size) => (
                    <option key={s.id} value={s.id}>{s.size}{s.unit} ({s.pack_type})</option>
                  ));
              })()}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>SKU Code</label>
        <input
          type="text"
          value={formData.sku}
          onChange={(e) => onFieldChange("sku", e.target.value)}
          placeholder="Auto-generated or enter manually"
          readOnly={editMode}
          className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all ${editMode ? "bg-[#F5F4EE] cursor-not-allowed text-gray-500" : "bg-white"}`}
          style={{ borderColor: "#E8E7E1" }}
        />
        {!editMode && <p className="text-[10px] uppercase tracking-wider font-bold ml-1" style={{ color: "#C9A83A" }}>Auto-fills when Grade + Flavor + Size selected</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Price (SAR)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => onFieldChange("price", e.target.value)}
          placeholder="0.00 (optional)"
          className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm font-semibold"
          style={{ borderColor: "#E8E7E1" }}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-[#1A1A1A]">SKU Status</label>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg" style={{ backgroundColor: formData.is_active ? "#DCFCE7" : "#FEE2E2", color: formData.is_active ? "#16A34A" : "#DC2626" }}>{formData.is_active ? "Active" : "Inactive"}</span>
        </div>
        <button type="button" onClick={() => onFieldChange("is_active", !formData.is_active)}
          className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shadow-inner"
          style={{ backgroundColor: formData.is_active ? "#E8C547" : "#E5E7EB" }}
        >
          <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm" style={{ transform: formData.is_active ? "translateX(24px)" : "translateX(4px)" }} />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Description</label>
        <textarea value={formData.description} onChange={(e) => onFieldChange("description", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Arabic Name</label>
        <input type="text" value={formData.name_arabic || ""} onChange={(e) => onFieldChange("name_arabic", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} dir="rtl" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Barcode</label>
          <input type="text" value={formData.barcode || ""} onChange={(e) => onFieldChange("barcode", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>SFDA Reg No</label>
          <input type="text" value={formData.sfda_reg_no || ""} onChange={(e) => onFieldChange("sfda_reg_no", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Shelf Life (Months)</label>
        <input type="number" min="0" value={formData.shelf_life_months || ""} onChange={(e) => onFieldChange("shelf_life_months", parseInt(e.target.value) || null)} className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Storage Instructions</label>
        <textarea value={formData.storage_instructions || ""} onChange={(e) => onFieldChange("storage_instructions", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Nutritional Values</label>
        <textarea value={formData.nutritional_values || ""} onChange={(e) => onFieldChange("nutritional_values", e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white" style={{ borderColor: "#E8E7E1" }} />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
        <button type="submit" disabled={isPending} className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer" style={{ backgroundColor: "#E8C547" }}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {editMode ? "Save Changes" : "Create SKU"}
        </button>
      </div>
    </form>
  );
}
