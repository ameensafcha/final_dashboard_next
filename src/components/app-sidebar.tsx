"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  ChevronDown,
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
  { label: "Daily Command", href: "/tasks/daily", icon: Sparkles },
  { label: "All Tasks", href: "/tasks", icon: ListTodo },
  { label: "Kanban Board", href: "/tasks/board", icon: LayoutGrid },
];

const inventoryPaths = ["/inventory"];
const productsPaths = ["/products"];
const productionPaths = ["/production"];
const financePaths = ["/finance"];
const taskPaths = ["/tasks"];

const NavItem = React.memo(({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all duration-200 group hover:scale-[1.02]",
      active
        ? "bg-[var(--accent)]/20 text-[var(--primary)] font-bold"
        : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
    <span className="text-sm">{label}</span>
  </Link>
));
NavItem.displayName = "NavItem";

const SubItem = React.memo(({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-200 group ml-4 hover:scale-[1.02]",
      active
        ? "text-[var(--primary)] font-bold bg-[var(--accent)]/10"
        : "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--surface)]"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
    <span className="text-[13px]">{label}</span>
  </Link>
));
SubItem.displayName = "SubItem";

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


  return (
    <aside
      className="h-screen w-64 flex flex-col bg-[var(--surface)]/80 backdrop-blur-md sticky top-0"
    >
      <div className="p-6 flex items-center gap-3 bg-[var(--glass-bg)]">
        <div className="w-10 h-10 bg-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
          <Package className="w-5 h-5 text-[var(--primary-foreground)]" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-[var(--foreground)] font-display">SAFCHA</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <NavItem 
          href="/dashboard" 
          label="Overview" 
          icon={LayoutDashboard} 
          active={isActive("/dashboard")} 
        />

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Management</p>
          
          <div className="space-y-1">
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all group hover:scale-[1.02]",
                isParentActive(inventoryPaths) ? "text-[var(--primary)] font-bold bg-[var(--accent)]/20" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              )}
            >
              <Package className={cn("w-5 h-5", isParentActive(inventoryPaths) ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
              <span className="flex-1 text-left text-sm">Inventory</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !inventoryOpen && "-rotate-90 text-[var(--muted)]")} />
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all group hover:scale-[1.02]",
                isParentActive(productsPaths) ? "text-[var(--primary)] font-bold bg-[var(--accent)]/20" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              )}
            >
              <ShoppingBag className={cn("w-5 h-5", isParentActive(productsPaths) ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
              <span className="flex-1 text-left text-sm">Products</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !productsOpen && "-rotate-90 text-[var(--muted)]")} />
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all group hover:scale-[1.02]",
                isParentActive(productionPaths) ? "text-[var(--primary)] font-bold bg-[var(--accent)]/20" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              )}
            >
              <Factory className={cn("w-5 h-5", isParentActive(productionPaths) ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
              <span className="flex-1 text-left text-sm">Production</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !productionOpen && "-rotate-90 text-[var(--muted)]")} />
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
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Operations</p>
          
          <div className="space-y-1">
            <button
              onClick={() => setTaskOpen(!taskOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all group hover:scale-[1.02]",
                isParentActive(taskPaths) ? "text-[var(--primary)] font-bold bg-[var(--accent)]/20" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              )}
            >
              <ListTodo className={cn("w-5 h-5", isParentActive(taskPaths) ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
              <span className="flex-1 text-left text-sm">Tasks</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !taskOpen && "-rotate-90 text-[var(--muted)]")} />
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all group hover:scale-[1.02]",
                isParentActive(financePaths) ? "text-[var(--primary)] font-bold bg-[var(--accent)]/20" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              )}
            >
              <DollarSign className={cn("w-5 h-5", isParentActive(financePaths) ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--primary)]")} />
              <span className="flex-1 text-left text-sm">Finance</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !financeOpen && "-rotate-90 text-[var(--muted)]")} />
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
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Settings</p>
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
        <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-sm mx-2 mb-2 rounded-[var(--radius-xl)] shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--primary)] font-bold text-xs shrink-0">
                {employee?.email?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--foreground)] truncate">
                  {employee?.email?.split('@')[0] || "User"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                  {isAdmin ? "admin" : "member"}
                </p>
              </div>
            </div>
            <NotificationCenter />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)] hover:bg-[var(--error-bg)] text-[var(--muted-foreground)] hover:text-[var(--error)] transition-all duration-200 group hover:scale-[1.02]"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
