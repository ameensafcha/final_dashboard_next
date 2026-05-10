"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Archive, Truck, Plus, X, Loader2, Edit, Search, ChevronDown } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface StocksData {
  raw_materials: {
    items: Array<{ id: string | number; name: string; quantity: number; unit: string; price_per_kg: number | null }>;
    total_quantity: number;
    item_count: number;
  };
  powder: {
    received: number;
    sent: number;
    available: number;
  };
  products: {
    items: Array<{
      id: string;
      variant_id: string;
      quantity: number;
      variant: {
        product: { name: string };
        flavor: { name: string };
        size: { size: string; unit: string };
      };
    }>;
    total_stock: number;
    variant_count: number;
  };
}

type TabType = "products" | "raw_materials" | "powder";

interface StocksTableProps {
  initialData: StocksData;
}

export function StocksTable({ initialData }: StocksTableProps) {
  const [data, setData] = useState<StocksData>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // Manual Update State
  const [isManualUpdateOpen, setIsManualUpdateOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [updateType, setUpdateType] = useState<"set" | "add" | "subtract">("set");
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [isExistingUpdate, setIsExistingUpdate] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");

  // Logic to fetch all variants for manual add
  const fetchVariants = useCallback(async () => {
    setIsLoadingVariants(true);
    try {
      const res = await fetch("/api/variants?limit=1000");
      const result = await res.json();
      // Handle both paginated and non-paginated responses
      const variantList = result?.variants || result?.data || [];
      setAllVariants(variantList);
    } catch (err) {
      console.error("Failed to fetch variants:", err);
    } finally {
      setIsLoadingVariants(false);
    }
  }, []);

  // Logic to fetch all stock data
  const refetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      if (data && !data.error) {
        setData(data);
      }
    } catch (err) {
      console.error("Failed to refetch stocks:", err);
    }
  }, []);

  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || !updateQuantity) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/variant-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: selectedVariantId,
          quantity: parseInt(updateQuantity),
          type: updateType,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      await refetchAll();
      setIsManualUpdateOpen(false);
      setUpdateQuantity("");
      setSelectedVariantId("");
    } catch (err) {
      console.error("Failed to update stock:", err);
      alert("Failed to update stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standardized real-time subscriptions for stock data
  useRealtimeSubscription({ table: 'raw_materials', onMessage: refetchAll });
  useRealtimeSubscription({ table: 'receiving_materials', onMessage: refetchAll });
  useRealtimeSubscription({ table: 'product_stock', onMessage: refetchAll });
  useRealtimeSubscription({ table: 'packing_receive_items', onMessage: refetchAll });
  useRealtimeSubscription({ table: 'finished_products', onMessage: refetchAll });
  useRealtimeSubscription({ table: 'packing_logs', onMessage: refetchAll });

  const tabs = [
    { id: "products" as TabType, label: "Product Inventory", icon: Truck },
    { id: "raw_materials" as TabType, label: "Raw Materials", icon: Package },
    { id: "powder" as TabType, label: "Powder", icon: Archive },
  ];

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer"
              style={{
                backgroundColor: isActive ? "#E8C547" : "transparent",
                color: isActive ? "#1A1A1A" : "#1A1A1A",
                border: `1px solid ${isActive ? "#E8C547" : "#E8E7E1"}`,
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* Product Inventory Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Product Inventory</h2>
                <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: "#F5F4EE", color: "#C9A83A" }}>
                  {data?.products?.variant_count || 0} variants
                </span>
              </div>
              <button
                onClick={() => {
                  setIsExistingUpdate(false);
                  setSelectedVariantId("");
                  setIsManualUpdateOpen(true);
                  fetchVariants();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
              >
                <Plus className="w-4 h-4" />
                Update Manual Stock
              </button>
            </div>
            
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
              {data?.products?.items?.length === 0 ? (
                <div className="p-8 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" style={{ color: "#C9A83A" }} />
                  <p style={{ color: "#C9A83A" }}>No product inventory</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F5F4EE" }}>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Size</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products?.items?.map((item, index) => (
                      <tr key={item.variant_id || index} style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{item.variant?.product?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.variant?.flavor?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.variant?.size?.size} {item.variant?.size?.unit}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#16A34A" }}>{item.quantity}</td>
                        <td className="px-4 py-3 text-sm">
                          <button 
                            onClick={() => {
                              setSelectedVariantId(item.variant_id);
                              setIsExistingUpdate(true);
                              setIsManualUpdateOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-yellow-100 cursor-pointer" 
                            style={{ color: "#E8C547" }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-2 text-sm font-medium" style={{ color: "#C9A83A" }}>
              Total Stock: {data?.products?.total_stock || 0} units
            </div>
          </div>
        )}

        {/* Raw Materials Tab */}
        {activeTab === "raw_materials" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Raw Materials</h2>
              <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: "#F5F4EE", color: "#C9A83A" }}>
                {data?.raw_materials?.item_count || 0} items
              </span>
            </div>
            
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
              {data?.raw_materials?.items?.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" style={{ color: "#C9A83A" }} />
                  <p style={{ color: "#C9A83A" }}>No raw materials</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F5F4EE" }}>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Unit</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Price/kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.raw_materials?.items?.map((item, index) => (
                      <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{item.name}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#16A34A" }}>{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.unit}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.price_per_kg ? `$${item.price_per_kg.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-2 text-sm font-medium" style={{ color: "#C9A83A" }}>
              Total: {data?.raw_materials?.total_quantity?.toFixed(2) || 0} kg
            </div>
          </div>
        )}

        {/* Powder Tab */}
        {activeTab === "powder" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Powder</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
                <p className="text-sm" style={{ color: "#16A34A" }}>Received</p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{data?.powder?.received?.toFixed(2) || 0} kg</p>
              </div>
              <div className="p-5 rounded-xl border" style={{ borderColor: "#F9731630", backgroundColor: "#FFF7ED" }}>
                <p className="text-sm" style={{ color: "#F97316" }}>Sent to Packing</p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{data?.powder?.sent?.toFixed(2) || 0} kg</p>
              </div>
              <div className="p-5 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#FEF9C3" }}>
                <p className="text-sm" style={{ color: "#E8C547" }}>Available</p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{data?.powder?.available?.toFixed(2) || 0} kg</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Update Dialog */}
      {isManualUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6" style={{ backgroundColor: "#FBFBF7" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Manual Stock Update</h3>
              <button onClick={() => setIsManualUpdateOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleManualUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#666" }}>Select Product Variant</label>
                {isExistingUpdate ? (
                  <>
                    <div className="w-full px-4 py-2 rounded-xl border bg-gray-50 text-sm font-medium flex items-center h-10" style={{ borderColor: "#E8E7E1" }}>
                      {(() => {
                        const item = data.products.items.find(i => i.variant_id === selectedVariantId);
                        return item ? `${item.variant.product.name} - ${item.variant.flavor.name} (${item.variant.size.size}${item.variant.size.unit})` : "Selected Variant";
                      })()}
                    </div>
                    {(() => {
                      const item = data.products.items.find(i => i.variant_id === selectedVariantId);
                      return item ? (
                        <div className="mt-2 text-sm font-medium" style={{ color: "#16A34A" }}>
                          Current Stock: <span className="font-bold">{item.quantity}</span> units
                        </div>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <div className="relative">
                    <div 
                      onClick={() => !isLoadingVariants && setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-4 py-2 rounded-xl border flex items-center justify-between cursor-pointer bg-white h-10 transition-all hover:border-[#E8C547]"
                      style={{ borderColor: isDropdownOpen ? "#E8C547" : "#E8E7E1" }}
                    >
                      <span className="text-sm truncate">
                        {selectedVariantId ? (() => {
                          const v = allVariants.find(v => v.id === selectedVariantId);
                          return v ? `${v.product.name} - ${v.flavor.name} (${v.size.size}${v.size.unit})` : "Select variant...";
                        })() : "Select variant..."}
                      </span>
                      {isLoadingVariants ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                      )}
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[280px]" style={{ borderColor: "#E8C54720" }}>
                        <div className="p-2 border-b" style={{ borderColor: "#F5F4EE" }}>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="text"
                              autoFocus
                              placeholder="Search products..."
                              value={variantSearch}
                              onChange={(e) => setVariantSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm bg-[#F5F4EE] rounded-xl border-none focus:ring-1 focus:ring-[#E8C547]"
                            />
                          </div>
                        </div>
                        <div className="overflow-auto py-1 scrollbar-hide">
                          {(() => {
                            const filtered = allVariants
                              .filter(v => !data.products.items.some(item => item.variant_id === v.id))
                              .filter(v => {
                                const search = variantSearch.toLowerCase();
                                return (
                                  v.product.name.toLowerCase().includes(search) ||
                                  v.flavor.name.toLowerCase().includes(search) ||
                                  v.sku?.toLowerCase().includes(search)
                                );
                              });

                            if (filtered.length === 0) {
                              return (
                                <div className="px-4 py-6 text-center text-sm text-gray-400 italic">
                                  {allVariants.length === 0 ? "Loading variants..." : "No variants found"}
                                </div>
                              );
                            }

                            return filtered.map((v) => (
                              <div 
                                key={v.id}
                                onClick={() => {
                                  setSelectedVariantId(v.id);
                                  setIsDropdownOpen(false);
                                  setVariantSearch("");
                                }}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#F5F4EE] transition-colors flex flex-col gap-0.5"
                              >
                                <span className="font-semibold text-[#1A1A1A]">{v.product.name}</span>
                                <div className="flex items-center gap-2 text-xs text-[#C9A83A]">
                                  <span>{v.flavor.name}</span>
                                  <span>•</span>
                                  <span>{v.size.size}{v.size.unit}</span>
                                  <span className="ml-auto opacity-60 font-mono uppercase">{v.sku}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#666" }}>Update Type</label>
                  <select
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: "#E8E7E1", backgroundColor: "white" }}
                  >
                    <option value="set">Set Exact</option>
                    <option value="add">Add (+)</option>
                    <option value="subtract">Subtract (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#666" }}>Quantity</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={updateQuantity}
                    onChange={(e) => setUpdateQuantity(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                    placeholder="Enter amount"
                    style={{ borderColor: "#E8E7E1", backgroundColor: "white" }}
                  />
                </div>
              </div>

              {isExistingUpdate && selectedVariantId && updateQuantity && !isNaN(parseInt(updateQuantity)) && (() => {
                const item = data.products.items.find(i => i.variant_id === selectedVariantId);
                if (!item) return null;
                const currentQty = item.quantity;
                const qty = parseInt(updateQuantity);
                let result: number;
                if (updateType === "set") result = qty;
                else if (updateType === "add") result = currentQty + qty;
                else if (updateType === "subtract") result = currentQty - qty;
                else result = currentQty;
                return (
                  <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: "#F5F4EE" }}>
                    <span className="text-sm font-medium" style={{ color: "#666" }}>
                      Current: <span className="font-bold" style={{ color: "#1A1A1A" }}>{currentQty}</span>
                      <span className="mx-2">→</span>
                      New: <span className="font-bold" style={{ color: result >= 0 ? "#16A34A" : "#DC2626" }}>{result}</span> units
                    </span>
                  </div>
                );
              })()}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualUpdateOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold border transition-all"
                  style={{ borderColor: "#E8E7E1", color: "#666" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#E8C547", color: "#1A1A1A", opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
