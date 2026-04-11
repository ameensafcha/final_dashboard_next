"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  BarChart3,
  Users,
  LogOut,
  ListTodo,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { NotificationCenter } from "@/components/notification-center";

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

const taskItems = [
  { label: "All Tasks", href: "/tasks", icon: ListTodo },
  { label: "My Tasks", href: "/tasks/my-tasks", icon: Users },
  { label: "Kanban Board", href: "/tasks/board", icon: LayoutGrid },
];

const inventoryPaths = ["/raw-materials", "/stocks", "/receiving"];
const productsPaths = ["/products"];
const productionPaths = ["/production", "/finished-products"];
const financePaths = ["/finance"];
const taskPaths = ["/tasks"];

export function AppSidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, employee, role, logout, isLoading } = useAuth();

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
  const [taskOpen, setTaskOpen] = React.useState(() =>
    taskPaths.some(p => pathname.startsWith(p))
  );

  React.useEffect(() => {
    if (inventoryPaths.some(p => pathname.startsWith(p))) setInventoryOpen(true);
    if (productsPaths.some(p => pathname.startsWith(p))) setProductsOpen(true);
    if (productionPaths.some(p => pathname.startsWith(p))) setProductionOpen(true);
    if (financePaths.some(p => pathname.startsWith(p))) setFinanceOpen(true);
    if (taskPaths.some(p => pathname.startsWith(p))) setTaskOpen(true);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isLoggedIn = !isLoading && user;

  return (
    <aside
      className="h-screen w-56 flex flex-col border-r"
      style={{ backgroundColor: "#F5F4EE", borderColor: "#E8C54720" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "#E8C54720" }}>
        <h1 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Dashboard</h1>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            isActive("/dashboard") ? "bg-yellow-200 font-medium" : "hover:bg-yellow-100"
          )}
          style={{ color: "#1A1A1A" }}
        >
          <LayoutDashboard className="w-5 h-5" style={{ color: "#E8C547" }} />
          <span>Dashboard</span>
        </Link>

        {/* Inventory */}
        <div>
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", inventoryOpen ? "bg-yellow-200" : "hover:bg-yellow-100")}
            style={{ color: "#1A1A1A" }}
          >
            <Package className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Inventory</span>
            {inventoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {inventoryOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {inventoryItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isActive(item.href) ? "bg-yellow-200" : "hover:bg-yellow-100")}>
                  <item.icon className="w-4 h-4" style={{ color: "#C9A83A" }} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <button
            onClick={() => setProductsOpen(!productsOpen)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", productsOpen ? "bg-yellow-200" : "hover:bg-yellow-100")}
            style={{ color: "#1A1A1A" }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Products</span>
            {productsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {productsOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {productsItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isActive(item.href) ? "bg-yellow-200" : "hover:bg-yellow-100")}>
                  <item.icon className="w-4 h-4" style={{ color: "#C9A83A" }} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Production */}
        <div>
          <button
            onClick={() => setProductionOpen(!productionOpen)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", productionOpen ? "bg-yellow-200" : "hover:bg-yellow-100")}
            style={{ color: "#1A1A1A" }}
          >
            <Factory className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Production</span>
            {productionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {productionOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {productionItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isActive(item.href) ? "bg-yellow-200" : "hover:bg-yellow-100")}>
                  <item.icon className="w-4 h-4" style={{ color: "#C9A83A" }} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Finance */}
        <div>
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", financeOpen ? "bg-yellow-200" : "hover:bg-yellow-100")}
            style={{ color: "#1A1A1A" }}
          >
            <DollarSign className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="flex-1 text-left font-semibold">Finance</span>
            {financeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {financeOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {financeItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isActive(item.href) ? "bg-yellow-200" : "hover:bg-yellow-100")}>
                  <item.icon className="w-4 h-4" style={{ color: "#C9A83A" }} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        {isLoggedIn && (
          <div>
            <button onClick={() => setTaskOpen(!taskOpen)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg", taskOpen ? "bg-yellow-200" : "hover:bg-yellow-100")}>
              <ListTodo className="w-5 h-5" style={{ color: "#E8C547" }} />
              <span className="flex-1 text-left font-semibold">Tasks</span>
              {taskOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {taskOpen && (
              <div className="ml-2 space-y-1 mt-1">
                {taskItems.map((item) => (
                  <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", isActive(item.href) ? "bg-yellow-200" : "hover:bg-yellow-100")}>
                    <item.icon className="w-4 h-4" style={{ color: "#C9A83A" }} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {isLoggedIn && (
          <Link
            href="/admin"
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg", isActive("/admin") ? "bg-yellow-200" : "hover:bg-yellow-100")}
          >
            <Users className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="font-semibold">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Footer */}
      {isLoggedIn && (
        <div className="p-3 border-t" style={{ borderColor: "#E8C54720" }}>
          {/* User info row with notification bell */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: "#1A1A1A" }}>
                {employee?.name || "User"}
              </p>
              <p className="text-xs capitalize opacity-70" style={{ color: "#1A1A1A" }}>
                {role || "guest"}
              </p>
            </div>
            <NotificationCenter />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
