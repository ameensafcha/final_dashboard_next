"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Archive } from "lucide-react";
import Link from "next/link";

async function fetchVariantInventory() {
  const res = await fetch("/api/variant-inventory");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface InventoryItem {
  id: string;
  variant_id: string;
  quantity: number;
  variant: {
    id: string;
    product: { name: string };
    flavor: { name: string };
    size: { size: string; unit: string };
    sku: string;
  };
}

export default function VariantInventoryPage() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["variant-inventory"],
    queryFn: fetchVariantInventory,
    refetchInterval: 5000,
  });

  const inventoryList: InventoryItem[] = inventory || [];
  const totalStock = inventoryList.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#E8C547" }}></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Product Inventory</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Packed product stock</p>
        </div>
        <Link href="/finished-products">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-yellow-50 cursor-pointer"
            style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
          >
            ← Back to Finished Products
          </button>
        </Link>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <p className="text-sm" style={{ color: "#16A34A" }}>Total Products in Stock</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{totalStock}</p>
        </div>
        <div className="p-5 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#FEF9C3" }}>
          <p className="text-sm" style={{ color: "#E8C547" }}>Unique Variants</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{inventoryList.length}</p>
        </div>
      </div>

      {/* Inventory Table */}
      {inventoryList.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "#C9A83A" }} />
          <p className="text-lg font-medium" style={{ color: "#C9A83A" }}>No inventory yet</p>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>
            Receive packed products from 3rd party to add inventory
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F5F4EE" }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Size</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>SKU</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventoryList.map((item, index) => (
                <tr 
                  key={item.id}
                  style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {item.variant?.product?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                    {item.variant?.flavor?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                    {item.variant?.size?.size} {item.variant?.size?.unit}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#C9A83A" }}>
                    {item.variant?.sku || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: "#16A34A" }}>
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
