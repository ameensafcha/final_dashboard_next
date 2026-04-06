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
  Plus,
  DollarSign,
  Factory,
  Archive,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const inventoryItems = [
  { label: "Raw Materials", href: "/raw-materials", icon: Package },
  { label: "Stocks", href: "/stocks", icon: BarChart3 },
  { label: "Receiving", href: "/receiving", icon: ArrowDownLeft },
];

const productsItems = [
  { label: "Product", href: "/products/entry", icon: Plus },
  { label: "Variants", href: "/products/variants", icon: Package },
  { label: "Flavors", href: "/products/flavors", icon: Sparkles },
  { label: "Sizes", href: "/products/sizes", icon: Ruler },
];

const productionItems = [
  { label: "Batches", href: "/production", icon: Factory },
  { label: "Finished Products", href: "/finished-products", icon: Archive },
];

const financeItems = [
  { label: "Transactions", href: "/finance/transactions", icon: DollarSign },
];

const inventoryPaths = ["/raw-materials", "/stocks", "/receiving"];
const productsPaths = ["/products"];
const productionPaths = ["/production", "/finished-products"];
const financePaths = ["/finance"];

export function AppSidebar() {
  const pathname = usePathname() || "";
  
  const [inventoryOpen, setInventoryOpen] = React.useState(() => 
    inventoryPaths.some(p => pathname.startsWith(p))
  );
  const [productsOpen, setProductsOpen] = React.useState(() => 
    productsPaths.some(p => pathname.startsWith(p))
  );
  const [productionOpen, setProductionOpen] = React.useState(() => 
    productionPaths.some(p => pathname.startsWith(p))
  );
  const [financeOpen, setFinanceOpen] = React.useState(() => 
    financePaths.some(p => pathname.startsWith(p))
  );

  React.useEffect(() => {
    const path = pathname || "";
    setInventoryOpen(inventoryPaths.some(p => path.startsWith(p)));
    setProductsOpen(productsPaths.some(p => path.startsWith(p)));
    setProductionOpen(productionPaths.some(p => path.startsWith(p)));
    setFinanceOpen(financePaths.some(p => path.startsWith(p)));
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <aside 
      className="h-screen w-56 flex flex-col border-r"
      style={{ backgroundColor: "#F5F4EE", borderColor: "#E8C54720" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "#E8C54720" }}>
        <h1 
          className="text-lg font-bold"
          style={{ color: "#1A1A1A" }}
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
              ? "bg-yellow-200 font-medium" 
              : "hover:bg-yellow-100"
          )}
          style={{ color: "#1A1A1A" }}
        >
          <LayoutDashboard className="w-5 h-5" style={{ color: isActive("/") ? "#E8C547" : "#C9A83A" }} />
          <span>Dashboard</span>
        </Link>

        {/* Inventory Section */}
        <div>
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              inventoryOpen ? "bg-yellow-200" : "hover:bg-yellow-100"
            )}
            style={{ color: "#1A1A1A" }}
          >
            <LayoutDashboard className="w-5 h-5" style={{ color: "#E8C547" }} />
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
                      ? "bg-yellow-200 font-medium" 
                      : "hover:bg-yellow-100"
                  )}
                  style={{ color: "#1A1A1A" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#E8C547" : "#C9A83A" }} 
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
              productsOpen ? "bg-yellow-200" : "hover:bg-yellow-100"
            )}
            style={{ color: "#1A1A1A" }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: "#E8C547" }} />
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
                      ? "bg-yellow-200 font-medium" 
                      : "hover:bg-yellow-100"
                  )}
                  style={{ color: "#1A1A1A" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#E8C547" : "#C9A83A" }} 
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Production Section */}
        <div>
          <button
            onClick={() => setProductionOpen(!productionOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              productionOpen ? "bg-yellow-200" : "hover:bg-yellow-100"
            )}
            style={{ color: "#1A1A1A" }}
          >
            <Factory className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Production</span>
            {productionOpen ? (
              <ChevronDown className="w-4 h-4 opacity-60" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </button>
          
          {productionOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {productionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                    isActive(item.href) 
                      ? "bg-yellow-200 font-medium" 
                      : "hover:bg-yellow-100"
                  )}
                  style={{ color: "#1A1A1A" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#E8C547" : "#C9A83A" }} 
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Finance Section */}
        <div>
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              financeOpen ? "bg-yellow-200" : "hover:bg-yellow-100"
            )}
            style={{ color: "#1A1A1A" }}
          >
            <DollarSign className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Finance</span>
            {financeOpen ? (
              <ChevronDown className="w-4 h-4 opacity-60" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </button>
          
          {financeOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {financeItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                    isActive(item.href) 
                      ? "bg-yellow-200 font-medium" 
                      : "hover:bg-yellow-100"
                  )}
                  style={{ color: "#1A1A1A" }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ color: isActive(item.href) ? "#E8C547" : "#C9A83A" }} 
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "#E8C54720" }}>
        <div className="text-xs opacity-60" style={{ color: "#1A1A1A" }}>
          v1.0.0
        </div>
      </div>
    </aside>
  );
}