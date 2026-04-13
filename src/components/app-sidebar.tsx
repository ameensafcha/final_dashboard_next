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
  LayoutGrid,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { NotificationCenter } from "@/components/notification-center";

const inventoryItems = [
  { label: "Raw Materials", href: "/inventory/raw-materials", icon: Package },
  { label: "Stocks", href: "/inventory/stocks", icon: BarChart3 },
  { label: "Receiving", href: "/inventory/receiving", icon: ArrowDownLeft },
];

const productsItems = [
  { label: "Product Entry", href: "/products/entry", icon: Plus },
  { label: "Variants", href: "/products/variants", icon: Package },
  { label: "Flavors", href: "/products/flavors", icon: Sparkles },
  { label: "Sizes", href: "/products/sizes", icon: Ruler },
];

const productionItems = [
  { label: "Batches", href: "/production/batches", icon: Factory },
  { label: "Finished Products", href: "/production/finished-products", icon: Archive },
];

const financeItems = [
  { label: "Transactions", href: "/finance/transactions", icon: DollarSign },
];

const taskItems = [
  { label: "All Tasks", href: "/tasks", icon: ListTodo },
  { label: "Kanban Board", href: "/tasks/board", icon: LayoutGrid },
];

const inventoryPaths = ["/inventory"];
const productsPaths = ["/products"];
const productionPaths = ["/production"];
const financePaths = ["/finance"];
const taskPaths = ["/tasks"];

export function AppSidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, employee, isAdmin, logout, isLoading } = useAuth();

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
  const isParentActive = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isLoggedIn = !isLoading && user;

  const NavItem = ({ href, label, icon: Icon, active }: { href: string, label: string, icon: any, active: boolean }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-amber-100 text-amber-900 font-bold border-l-4 border-amber-500 rounded-l-none" 
          : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
      <span className="text-sm">{label}</span>
    </Link>
  );

  const SubItem = ({ href, label, icon: Icon, active }: { href: string, label: string, icon: any, active: boolean }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 group ml-4",
        active 
          ? "text-amber-700 font-bold bg-white shadow-sm" 
          : "text-gray-500 hover:text-amber-600 hover:bg-white/50"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-amber-500" : "text-gray-300 group-hover:text-amber-400")} />
      <span className="text-[13px]">{label}</span>
    </Link>
  );

  return (
    <aside
      className="h-screen w-64 flex flex-col border-r bg-[#F9F8F3] sticky top-0"
      style={{ borderColor: "#E8C54720" }}
    >
      <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: "#E8C54720" }}>
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Package className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-gray-900">SAFCHA</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <NavItem 
          href="/dashboard" 
          label="Overview" 
          icon={LayoutDashboard} 
          active={isActive("/dashboard")} 
        />

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Management</p>
          
          <div className="space-y-1">
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                isParentActive(inventoryPaths) ? "text-amber-900 font-bold" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              <Package className={cn("w-5 h-5", isParentActive(inventoryPaths) ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
              <span className="flex-1 text-left text-sm">Inventory</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !inventoryOpen && "-rotate-90 text-gray-300")} />
            </button>
            {inventoryOpen && (
              <div className="space-y-1 py-1">
                {inventoryItems.map((item) => (
                  <SubItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 mt-1">
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                isParentActive(productsPaths) ? "text-amber-900 font-bold" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              <ShoppingBag className={cn("w-5 h-5", isParentActive(productsPaths) ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
              <span className="flex-1 text-left text-sm">Products</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !productsOpen && "-rotate-90 text-gray-300")} />
            </button>
            {productsOpen && (
              <div className="space-y-1 py-1">
                {productsItems.map((item) => (
                  <SubItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 mt-1">
            <button
              onClick={() => setProductionOpen(!productionOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                isParentActive(productionPaths) ? "text-amber-900 font-bold" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              <Factory className={cn("w-5 h-5", isParentActive(productionPaths) ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
              <span className="flex-1 text-left text-sm">Production</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !productionOpen && "-rotate-90 text-gray-300")} />
            </button>
            {productionOpen && (
              <div className="space-y-1 py-1">
                {productionItems.map((item) => (
                  <SubItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 pb-2">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Operations</p>
          
          <div className="space-y-1">
            <button
              onClick={() => setTaskOpen(!taskOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                isParentActive(taskPaths) ? "text-amber-900 font-bold" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              <ListTodo className={cn("w-5 h-5", isParentActive(taskPaths) ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
              <span className="flex-1 text-left text-sm">Tasks</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !taskOpen && "-rotate-90 text-gray-300")} />
            </button>
            {taskOpen && (
              <div className="space-y-1 py-1">
                {taskItems.map((item) => (
                  <SubItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 mt-1">
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                isParentActive(financePaths) ? "text-amber-900 font-bold" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              <DollarSign className={cn("w-5 h-5", isParentActive(financePaths) ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500")} />
              <span className="flex-1 text-left text-sm">Finance</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !financeOpen && "-rotate-90 text-gray-300")} />
            </button>
            {financeOpen && (
              <div className="space-y-1 py-1">
                {financeItems.map((item) => (
                  <SubItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin Panel Link */}
        {isLoggedIn && isAdmin && (
          <div className="pt-2">
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Settings</p>
            <NavItem 
              href="/admin" 
              label="Admin Panel" 
              icon={ShieldCheck} 
              active={isActive("/admin")} 
            />
          </div>
        )}
      </nav>

      {/* Modern Footer */}
      {isLoggedIn && (
        <div className="p-4 bg-white/50 border-t mx-2 mb-2 rounded-2xl border-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-xs shrink-0 border border-amber-200">
                {employee?.email?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {employee?.email?.split('@')[0] || "User"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {isAdmin ? "admin" : "member"}
                </p>
              </div>
            </div>
            <NotificationCenter />
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all duration-200 group border border-gray-100 hover:border-red-100"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
