"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  ChevronDown, 
  ChevronRight, 
  LayoutDashboard, 
  ArrowDownLeft,
  ShoppingBag,
  Sparkles,
  Ruler,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const inventoryItems = [
  { label: "Raw Materials", href: "/raw-materials", icon: Package },
  { label: "Receiving", href: "/receiving", icon: ArrowDownLeft },
];

const productsItems = [
  { label: "Product", href: "/products/entry", icon: Plus },
  { label: "Variants", href: "/products/variants", icon: Package },
  { label: "Flavors", href: "/products/flavors", icon: Sparkles },
  { label: "Sizes", href: "/products/sizes", icon: Ruler },
];

export function AppSidebar() {
  const [inventoryOpen, setInventoryOpen] = React.useState(true);
  const [productsOpen, setProductsOpen] = React.useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside 
      className="h-screen w-56 flex flex-col border-r"
      style={{ backgroundColor: "#FAF5FF", borderColor: "#7C3AED20" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "#7C3AED20" }}>
        <h1 
          className="text-lg font-bold"
          style={{ color: "#4C1D95" }}
        >
          Dashboard
        </h1>
      </div>
      
      <nav className="flex-1 p-3 space-y-2">
        {/* Dashboard Link */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
            isActive("/") 
              ? "bg-purple-200 font-medium" 
              : "hover:bg-purple-100"
          )}
          style={{ color: "#4C1D95" }}
        >
          <LayoutDashboard className="w-5 h-5" style={{ color: isActive("/") ? "#7C3AED" : "#A78BFA" }} />
          <span>Dashboard</span>
        </Link>

        {/* Inventory Section */}
        <div>
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              inventoryOpen ? "bg-purple-200" : "hover:bg-purple-100"
            )}
            style={{ color: "#4C1D95" }}
          >
            <LayoutDashboard className="w-5 h-5" style={{ color: "#7C3AED" }} />
            <span className="flex-1 text-left font-semibold">Inventory</span>
            {inventoryOpen ? (
              <ChevronDown className="w-4 h-4 opacity-60" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </button>
          
          {inventoryOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {inventoryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                    isActive(item.href) 
                      ? "bg-purple-200 font-medium" 
                      : "hover:bg-purple-100"
                  )}
                  style={{ color: "#4C1D95" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#7C3AED" : "#A78BFA" }} 
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Products Section */}
        <div>
          <button
            onClick={() => setProductsOpen(!productsOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              productsOpen ? "bg-purple-200" : "hover:bg-purple-100"
            )}
            style={{ color: "#4C1D95" }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: "#7C3AED" }} />
            <span className="flex-1 text-left font-semibold">Products</span>
            {productsOpen ? (
              <ChevronDown className="w-4 h-4 opacity-60" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </button>
          
          {productsOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {productsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                    isActive(item.href) 
                      ? "bg-purple-200 font-medium" 
                      : "hover:bg-purple-100"
                  )}
                  style={{ color: "#4C1D95" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#7C3AED" : "#A78BFA" }} 
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "#7C3AED20" }}>
        <div className="text-xs opacity-60" style={{ color: "#4C1D95" }}>
          v1.0.0
        </div>
      </div>
    </aside>
  );
}