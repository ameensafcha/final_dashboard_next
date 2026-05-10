"use client";

import { Plus, ShoppingBag, Package, CheckCircle, LayoutGrid, List, Layers, Loader2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { type Product, type Variant, type ProductFlavor, type Batch } from "./types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "variants", label: "Variants" },
  { id: "batches", label: "Batches" },
  { id: "ingredients", label: "Ingredients" },
];

interface ProductViewContentProps {
  viewProduct: Product;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedFlavorId: string | null;
  onFlavorSelect: (flavorId: string | null) => void;
  variantViewMode: "grid" | "list";
  onVariantViewModeChange: (mode: "grid" | "list") => void;
  selectedVariantForBatch: Variant | null;
  onVariantForBatchSelect: (variant: Variant | null) => void;
  batches: Batch[] | undefined;
  batchesLoading: boolean;
  onEditProduct: () => void;
  onLogBatch: () => void;
  onEditBatch: (batch: Batch) => void;
  onDeleteBatch: (batchId: string) => void;
  onClose: () => void;
}

export function ProductViewContent({
  viewProduct,
  activeTab,
  onTabChange,
  selectedFlavorId,
  onFlavorSelect,
  variantViewMode,
  onVariantViewModeChange,
  selectedVariantForBatch,
  onVariantForBatchSelect,
  batches,
  batchesLoading,
  onEditProduct,
  onLogBatch,
  onEditBatch,
  onDeleteBatch,
  onClose,
}: ProductViewContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{viewProduct.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm" style={{ color: "#C9A83A" }}>{viewProduct.variants?.length || 0} Variants</span>
            <span style={{ color: "#C9A83A" }}>•</span>
            <span className="text-sm" style={{ color: "#16A34A" }}>{viewProduct.variants_count?.active || 0} Active</span>
            <span style={{ color: "#C9A83A" }}>•</span>
            <span className="text-sm" style={{ color: "#DC2626" }}>{viewProduct.variants_count?.inactive || 0} Inactive</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditProduct}
            className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer"
            style={{ backgroundColor: "#E8C547" }}
          >
            Edit Product
          </button>
          <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: viewProduct.is_active ? "#DCFCE7" : "#FEE2E2", color: viewProduct.is_active ? "#16A34A" : "#DC2626" }}>
            {viewProduct.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F5F4EE" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === tab.id ? "#FFFFFF" : "transparent",
              color: activeTab === tab.id ? "#E8C547" : "#C9A83A",
              boxShadow: activeTab === tab.id ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <OverviewTab viewProduct={viewProduct} />
        )}
        {activeTab === "variants" && (
          <VariantsTab
            viewProduct={viewProduct}
            selectedFlavorId={selectedFlavorId}
            onFlavorSelect={onFlavorSelect}
            variantViewMode={variantViewMode}
            onVariantViewModeChange={onVariantViewModeChange}
          />
        )}
        {activeTab === "batches" && (
          <BatchesTab
            viewProduct={viewProduct}
            selectedVariantForBatch={selectedVariantForBatch}
            onVariantForBatchSelect={onVariantForBatchSelect}
            batches={batches}
            batchesLoading={batchesLoading}
            onLogBatch={onLogBatch}
            onEditBatch={onEditBatch}
            onDeleteBatch={onDeleteBatch}
          />
        )}
        {activeTab === "ingredients" && (
          <IngredientsTab
            viewProduct={viewProduct}
            selectedFlavorId={selectedFlavorId}
            onFlavorSelect={onFlavorSelect}
          />
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: "#F5F4EE" }}>
        <button onClick={onClose} className="px-8 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Close</button>
      </div>
    </div>
  );
}

function OverviewTab({ viewProduct }: { viewProduct: Product }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {viewProduct.description && (
        <div className="p-5 rounded-2xl border bg-[#FBFBF7]" style={{ borderColor: "#F5F4EE" }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: "#C9A83A" }}>Description</p>
          <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{viewProduct.description}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#E8C54720", backgroundColor: "#FBFBF7" }}>
          <p className="text-3xl font-bold" style={{ color: "#E8C547" }}>{viewProduct.product_flavors?.length || 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#C9A83A" }}>Flavors</p>
        </div>
        <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#16A34A20", backgroundColor: "#F0FDF4" }}>
          <p className="text-3xl font-bold" style={{ color: "#16A34A" }}>{viewProduct.variants_count?.active || 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#16A34A" }}>Active</p>
        </div>
        <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#DC262620", backgroundColor: "#FEF2F2" }}>
          <p className="text-3xl font-bold" style={{ color: "#DC2626" }}>{viewProduct.variants_count?.inactive || 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#DC2626" }}>Inactive</p>
        </div>
      </div>
    </div>
  );
}

interface VariantsTabProps {
  viewProduct: Product;
  selectedFlavorId: string | null;
  onFlavorSelect: (flavorId: string | null) => void;
  variantViewMode: "grid" | "list";
  onVariantViewModeChange: (mode: "grid" | "list") => void;
}

function VariantsTab({ viewProduct, selectedFlavorId, onFlavorSelect, variantViewMode, onVariantViewModeChange }: VariantsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: "#C9A83A" }}>{viewProduct.product_flavors?.length} available flavors</p>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F4EE]">
          <button onClick={() => onVariantViewModeChange("grid")} className="p-2 rounded-lg cursor-pointer transition-all" style={{ backgroundColor: variantViewMode === "grid" ? "#FFFFFF" : "transparent", color: variantViewMode === "grid" ? "#E8C547" : "#C9A83A" }}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => onVariantViewModeChange("list")} className="p-2 rounded-lg cursor-pointer transition-all" style={{ backgroundColor: variantViewMode === "list" ? "#FFFFFF" : "transparent", color: variantViewMode === "list" ? "#E8C547" : "#C9A83A" }}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {viewProduct.product_flavors?.map((pf: ProductFlavor) => {
          const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === pf.flavor.id) || [];
          const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
          return (
            <button key={pf.id} type="button" onClick={() => onFlavorSelect(pf.flavor.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "white",
                color: selectedFlavorId === pf.flavor.id ? "white" : "#1A1A1A",
                borderColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "#E8E7E1"
              }}
            >
              {pf.flavor.name} <span className="ml-1 opacity-70">({activeCount})</span>
            </button>
          );
        })}
      </div>

      {selectedFlavorId && (() => {
        const pf = viewProduct.product_flavors.find((p: ProductFlavor) => p.flavor.id === selectedFlavorId);
        const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === selectedFlavorId) || [];
        const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
        const inactiveCount = flavorVariants.length - activeCount;
        return (
          <div className="rounded-[1.5rem] border overflow-hidden bg-[#FBFBF7]" style={{ borderColor: "#F5F4EE" }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#F5F4EE" }}>
              <span className="font-bold text-sm text-[#1A1A1A]">{pf?.flavor.name} Variants</span>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>{activeCount} Active</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{inactiveCount} Inactive</span>
              </div>
            </div>
            <div className="p-4">
              {flavorVariants.length > 0 ? (
                variantViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {flavorVariants.map((variant: Variant) => (
                      <div key={variant.id}
                        className="p-4 rounded-2xl border text-center cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                        style={{
                          borderColor: variant.is_active ? "#16A34A20" : "#DC262620",
                          backgroundColor: variant.is_active ? "#FFFFFF" : "#FEF2F2"
                        }}
                      >
                        {variant.is_active && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#16A34A]" />
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: variant.grade === "500M" ? "#7C3AED" : "#2563EB" }}>{variant.grade}</p>
                        <p className="text-base font-bold" style={{ color: "#1A1A1A" }}>{variant.size.size}{variant.size.unit}</p>
                        <p className="text-[10px] text-gray-400 font-bold mb-3">{variant.size.pack_type}</p>
                        <div className="flex flex-col items-center gap-1">
                          {variant.price > 0 ? (
                            <p className="text-sm font-bold" style={{ color: "#E8C547" }}>
                              {variant.price} SAR
                            </p>
                          ) : (
                            <p className="text-sm" style={{ color: "#DC2626" }}>No Price</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {flavorVariants.map((variant: Variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 rounded-2xl border bg-white hover:shadow-md transition-all" style={{ borderColor: "#F5F4EE" }}>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider" style={{ backgroundColor: variant.grade === "500M" ? "#F3E8FF" : "#EFF6FF", color: variant.grade === "500M" ? "#7C3AED" : "#2563EB" }}>{variant.grade}</span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{variant.size.size}{variant.size.unit}</p>
                            <p className="text-[10px] font-bold text-[#C9A83A] uppercase tracking-wider">{variant.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {variant.price > 0 ? (
                            <p className="text-sm font-bold" style={{ color: "#E8C547" }}>
                              {variant.price} SAR
                            </p>
                          ) : (
                            <p className="text-sm" style={{ color: "#DC2626" }}>No Price</p>
                          )}
                          {variant.is_active ? <CheckCircle className="w-5 h-5 text-[#16A34A]" /> : <span className="text-xs font-bold text-[#DC2626]">Inactive</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "#C9A83A" }} />
                  <p className="text-sm font-bold text-red-400">No variants generated yet</p>
                  <p className="text-xs mt-1 text-gray-400">Go to SKUs page to generate variants for this flavor</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface BatchesTabProps {
  viewProduct: Product;
  selectedVariantForBatch: Variant | null;
  onVariantForBatchSelect: (variant: Variant | null) => void;
  batches: Batch[] | undefined;
  batchesLoading: boolean;
  onLogBatch: () => void;
  onEditBatch: (batch: Batch) => void;
  onDeleteBatch: (batchId: string) => void;
}

function BatchesTab({ viewProduct, selectedVariantForBatch, onVariantForBatchSelect, batches, batchesLoading, onLogBatch, onEditBatch, onDeleteBatch }: BatchesTabProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#C9A83A" }}>Step 1: Select SKU to view batches</p>
        <div className="flex flex-wrap gap-2 p-4 rounded-[1.5rem] bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
          {(viewProduct.variants || []).map((v: Variant) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onVariantForBatchSelect(v)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: selectedVariantForBatch?.id === v.id ? "#E8C547" : "white",
                color: selectedVariantForBatch?.id === v.id ? "white" : "#1A1A1A",
                borderColor: selectedVariantForBatch?.id === v.id ? "#E8C547" : "#E8E7E1",
              }}
            >
              {v.sku}
            </button>
          ))}
        </div>
      </div>

      {selectedVariantForBatch && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-base font-bold text-[#1A1A1A]">{selectedVariantForBatch.sku}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-[#F5F4EE] text-[#C9A83A] uppercase tracking-wider">{selectedVariantForBatch.flavor.name} • {selectedVariantForBatch.size.size}{selectedVariantForBatch.size.unit}</span>
            </div>
            <button
              onClick={onLogBatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
              style={{ backgroundColor: "#F97316" }}
            >
              <Plus className="w-3.5 h-3.5" /> Log New Batch
            </button>
          </div>

          {batchesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#E8C547]" /></div>
          ) : batches && batches.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {batches.map((batch: Batch) => (
                <div key={batch.id} className="p-4 rounded-[1.5rem] border bg-[#FBFBF7] group hover:border-[#E8C54740] transition-all" style={{ borderColor: "#F5F4EE" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center font-bold text-lg text-[#1A1A1A]" style={{ borderColor: "#F5F4EE" }}>
                        {batch.quantity}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#C9A83A] uppercase tracking-widest">{batch.batch_id}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-[#1A1A1A]">{batch.location}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-white border rounded-lg">{batch.packaging_state}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditBatch(batch)} className="p-2 rounded-xl hover:bg-[#E8C54720] transition-colors cursor-pointer"><Edit className="w-4 h-4 text-[#E8C547]" /></button>
                      <button onClick={() => onDeleteBatch(batch.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </div>
                  {(batch.manufacturing_date || batch.expiry_date) && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-white">
                      {batch.manufacturing_date && (
                        <div>
                          <p className="text-[9px] font-bold text-[#C9A83A] uppercase tracking-widest">Mfg Date</p>
                          <p className="text-xs font-bold text-[#1A1A1A]">{format(new Date(batch.manufacturing_date), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                      {batch.expiry_date && (
                        <div>
                          <p className="text-[9px] font-bold text-[#C9A83A] uppercase tracking-widest">Expiry Date</p>
                          <p className="text-xs font-bold text-[#1A1A1A]">{format(new Date(batch.expiry_date), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-[1.5rem] bg-[#FBFBF7] border border-dashed border-[#E8E7E1]">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-10" />
              <p className="text-sm font-bold text-gray-400">No batches logged for this SKU</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface IngredientsTabProps {
  viewProduct: Product;
  selectedFlavorId: string | null;
  onFlavorSelect: (flavorId: string | null) => void;
}

function IngredientsTab({ viewProduct, selectedFlavorId, onFlavorSelect }: IngredientsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {viewProduct.product_flavors?.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {viewProduct.product_flavors.map((pf: ProductFlavor) => (
              <button key={pf.id} type="button" onClick={() => onFlavorSelect(pf.flavor.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border"
                style={{
                  backgroundColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "white",
                  color: selectedFlavorId === pf.flavor.id ? "white" : "#1A1A1A",
                  borderColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "#E8E7E1"
                }}
              >
                {pf.flavor.name}
              </button>
            ))}
          </div>
          {selectedFlavorId && (() => {
            const pf = viewProduct.product_flavors.find((p: ProductFlavor) => p.flavor.id === selectedFlavorId);
            return pf ? (
              <div className="p-6 rounded-[1.5rem] border bg-[#FBFBF7] relative overflow-hidden" style={{ borderColor: "#F5F4EE" }}>
                <div className="absolute top-0 right-0 p-3 opacity-10"><ShoppingBag className="w-12 h-12" /></div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-bold text-lg text-[#1A1A1A]">{pf.flavor.name}</span>
                  <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold bg-[#E8C54720] text-[#E8C547] uppercase tracking-wider">{pf.flavor.short_code}</span>
                </div>
                {pf.flavor.ingredients ? (
                  <div className="flex flex-wrap gap-2">
                    {pf.flavor.ingredients.split(",").map((ing: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 rounded-xl text-xs font-bold border bg-white text-[#4B5563]" style={{ borderColor: "#F5F4EE" }}>{ing.trim()}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-gray-400 italic">No specific ingredients listed for this flavor.</p>
                )}
              </div>
            ) : null;
          })()}
        </>
      ) : (
        <div className="text-center py-10 rounded-[1.5rem] bg-[#FBFBF7] border border-dashed border-[#E8E7E1]">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-10" />
          <p className="text-sm font-bold text-gray-400">No flavors assigned to this product.</p>
        </div>
      )}
    </div>
  );
}
