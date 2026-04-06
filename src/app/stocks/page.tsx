"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Archive, Truck } from "lucide-react";
import { useState } from "react";

async function fetchStocks() {
  const res = await fetch("/api/stocks");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface StocksData {
  raw_materials: {
    items: Array<{ id: number; name: string; quantity: number; unit: string; price_per_kg: number | null }>;
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

export default function StocksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("products");

  const { data: stocks, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: fetchStocks,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#E8C547" }}></div>
      </div>
    );
  }

  const data: StocksData = stocks as StocksData;

  const tabs = [
    { id: "products" as TabType, label: "Product Inventory", icon: Truck },
    { id: "raw_materials" as TabType, label: "Raw Materials", icon: Package },
    { id: "powder" as TabType, label: "Powder", icon: Archive },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Stocks</h1>

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
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Product Inventory</h2>
              <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: "#F5F4EE", color: "#C9A83A" }}>
                {data?.products?.variant_count || 0} variants
              </span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products?.items?.map((item, index) => (
                      <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{item.variant?.product?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.variant?.flavor?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.variant?.size?.size} {item.variant?.size?.unit}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#16A34A" }}>{item.quantity}</td>
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
    </div>
  );
}
