"use client";

import { type Variant } from "./types";

interface VariantViewContentProps {
  variant: Variant;
  onEdit: () => void;
  onClose: () => void;
}

export function VariantViewContent({ variant, onEdit, onClose }: VariantViewContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-5 rounded-[1.5rem]" style={{ backgroundColor: "#FBFBF7" }}>
        <div>
          <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>{variant.product.name}</h3>
          <p className="text-sm font-mono mt-1" style={{ color: "#C9A83A" }}>{variant.sku}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: variant.grade === "500M" ? "#F3E8FF" : "#EFF6FF", color: variant.grade === "500M" ? "#7C3AED" : "#2563EB" }}>
          {variant.grade}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Flavor</p>
          <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{variant.flavor.name}</p>
        </div>
        <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Size</p>
          <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{variant.size.size}{variant.size.unit}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">{variant.size.pack_type}</p>
        </div>
        <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Price</p>
          <p className="text-2xl font-bold" style={{ color: variant.price > 0 ? "#E8C547" : "#DC2626" }}>
            {variant.price > 0 ? `${variant.price} SAR` : "Price Not Set"}
          </p>
        </div>
      </div>

      {variant.description && (
        <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Description</p>
          <p className="text-sm" style={{ color: "#1A1A1A" }}>{variant.description}</p>
        </div>
      )}

      {variant.name_arabic && (
        <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Arabic Name</p>
          <p className="text-sm" style={{ color: "#1A1A1A" }} dir="rtl">{variant.name_arabic}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {variant.barcode && (
          <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
            <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Barcode</p>
            <p className="text-sm font-mono" style={{ color: "#1A1A1A" }}>{variant.barcode}</p>
          </div>
        )}
        {variant.sfda_reg_no && (
          <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
            <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>SFDA Reg No</p>
            <p className="text-sm font-mono" style={{ color: "#1A1A1A" }}>{variant.sfda_reg_no}</p>
          </div>
        )}
      </div>

      {variant.shelf_life_months && (
        <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Shelf Life</p>
          <p className="text-sm" style={{ color: "#1A1A1A" }}>{variant.shelf_life_months} months</p>
        </div>
      )}

      {variant.storage_instructions && (
        <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Storage Instructions</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{variant.storage_instructions}</p>
        </div>
      )}

      {variant.nutritional_values && (
        <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Nutritional Values</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{variant.nutritional_values}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Close</button>
        <button onClick={onEdit} className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer" style={{ backgroundColor: "#E8C547" }}>
          Edit Details
        </button>
      </div>
    </div>
  );
}
