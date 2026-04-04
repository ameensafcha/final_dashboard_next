"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Sparkles, Ruler, ArrowDownLeft } from "lucide-react";

async function fetchStats() {
  const [products, rawMaterials, flavors, sizes, receivings] = await Promise.all([
    fetch("/api/products").then(r => r.json()),
    fetch("/api/raw-materials").then(r => r.json()),
    fetch("/api/flavors").then(r => r.json()),
    fetch("/api/sizes").then(r => r.json()),
    fetch("/api/receiving").then(r => r.json()),
  ]);

  return {
    totalProducts: products.length,
    totalRawMaterials: rawMaterials.length,
    totalFlavors: flavors.length,
    activeSizes: sizes.filter((s: { is_active: boolean }) => s.is_active).length,
    recentProducts: products.slice(0, 5),
    recentReceivings: receivings.slice(0, 5),
  };
}

export default function Dashboard() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Welcome to Inventory Management System</p>
        </div>
        <div className="p-8 rounded-xl border text-center" style={{ backgroundColor: "#FEE2E2", borderColor: "#DC2626" }}>
          <p className="font-medium" style={{ color: "#DC2626" }}>Failed to load dashboard data</p>
          <p className="text-sm mt-1" style={{ color: "#DC2626" }}>{error?.message || "Please check your connection and try again"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#7C3AED", color: "white" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Welcome to Inventory Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
              <ShoppingBag className="w-6 h-6" style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#A78BFA" }}>Total Products</p>
              <p className="text-2xl font-bold" style={{ color: "#4C1D95" }}>{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
              <Package className="w-6 h-6" style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#A78BFA" }}>Raw Materials</p>
              <p className="text-2xl font-bold" style={{ color: "#4C1D95" }}>{stats?.totalRawMaterials || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
              <Sparkles className="w-6 h-6" style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#A78BFA" }}>Flavors</p>
              <p className="text-2xl font-bold" style={{ color: "#4C1D95" }}>{stats?.totalFlavors || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
              <Ruler className="w-6 h-6" style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#A78BFA" }}>Active Sizes</p>
              <p className="text-2xl font-bold" style={{ color: "#4C1D95" }}>{stats?.activeSizes || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#7C3AED20", backgroundColor: "#FAF5FF" }}>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" style={{ color: "#7C3AED" }} />
              <span className="font-semibold" style={{ color: "#4C1D95" }}>Recent Products</span>
            </div>
          </div>
          <div className="p-4">
            {stats?.recentProducts && stats.recentProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.recentProducts.map((product: { id: string; name: string; price: number; sku: string }) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#4C1D95" }}>{product.name}</p>
                      <p className="text-xs font-mono" style={{ color: "#A78BFA" }}>{product.sku}</p>
                    </div>
                    <span className="font-semibold" style={{ color: "#7C3AED" }}>{product.price} SAR</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: "#A78BFA" }}>No products yet</p>
            )}
          </div>
        </div>

        {/* Recent Receiving */}
        <div className="rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#7C3AED20", backgroundColor: "#FAF5FF" }}>
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4" style={{ color: "#7C3AED" }} />
              <span className="font-semibold" style={{ color: "#4C1D95" }}>Recent Receiving</span>
            </div>
          </div>
          <div className="p-4">
            {stats?.recentReceivings && stats.recentReceivings.length > 0 ? (
              <div className="space-y-3">
                {stats.recentReceivings.map((receiving: { id: string; raw_material: { name: string }; quantity: number; supplier: string; date: string }) => (
                  <div key={receiving.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "#FAF5FF" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#4C1D95" }}>{receiving.raw_material?.name}</p>
                      <p className="text-xs" style={{ color: "#A78BFA" }}>{receiving.supplier} • {receiving.quantity} units</p>
                    </div>
                    <span className="text-xs" style={{ color: "#A78BFA" }}>
                      {new Date(receiving.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: "#A78BFA" }}>No receiving records</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 rounded-xl border" style={{ backgroundColor: "#FAF5FF", borderColor: "#7C3AED20" }}>
        <p className="font-semibold mb-3" style={{ color: "#4C1D95" }}>Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <a href="/raw-materials" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: "#7C3AED", color: "white" }}>
            Add Raw Material
          </a>
          <a href="/receiving" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: "#7C3AED", color: "white" }}>
            Record Receiving
          </a>
          <a href="/products" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: "#7C3AED", color: "white" }}>
            Add Product
          </a>
          <a href="/products/flavors" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: "#7C3AED", color: "white" }}>
            Manage Flavors
          </a>
        </div>
      </div>
    </div>
  );
}
