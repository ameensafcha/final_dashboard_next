export const PERMISSIONS = {
  DASHBOARD: 'dashboard:view',
  INVENTORY: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',
  STOCKS: 'stocks:view',
  RECEIVING: 'receiving:manage',
  PRODUCTS: 'products:read',
  PRODUCTS_MANAGE: 'products:manage',
  VARIANTS: 'products:variants',
  FLAVORS: 'products:flavors',
  SIZES: 'products:sizes',
  PRODUCTION: 'production:read',
  PRODUCTION_MANAGE: 'production:manage',
  BATCHES: 'production:batches',
  FINISHED_PRODUCTS: 'production:finished',
  FINANCE: 'finance:read',
  FINANCE_MANAGE: 'finance:manage',
  TASKS: 'tasks:read',
  TASKS_MANAGE: 'tasks:manage',
  ADMIN: 'admin:access',
  EMPLOYEES: 'employees:manage',
  ROLES: 'roles:manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];

export const PERMISSION_LABELS: Record<PermissionValue, string> = {
  'dashboard:view': 'View Dashboard',
  'inventory:read': 'View Inventory',
  'inventory:manage': 'Manage Inventory',
  'stocks:view': 'View Stocks',
  'receiving:manage': 'Manage Receiving',
  'products:read': 'View Products',
  'products:manage': 'Manage Products',
  'products:variants': 'Manage Variants',
  'products:flavors': 'Manage Flavors',
  'products:sizes': 'Manage Sizes',
  'production:read': 'View Production',
  'production:manage': 'Manage Production',
  'production:batches': 'Manage Batches',
  'production:finished': 'Manage Finished Products',
  'finance:read': 'View Finance',
  'finance:manage': 'Manage Finance',
  'tasks:read': 'View Tasks',
  'tasks:manage': 'Manage Tasks',
  'admin:access': 'Admin Panel Access',
  'employees:manage': 'Manage Employees',
  'roles:manage': 'Manage Roles',
};

export const SIDEBAR_PERMISSION_MAP: Record<string, PermissionValue> = {
  '/dashboard': 'dashboard:view',
  '/inventory': 'inventory:read',
  '/inventory/raw-materials': 'inventory:read',
  '/inventory/stocks': 'stocks:view',
  '/inventory/receiving': 'receiving:manage',
  '/products': 'products:read',
  '/products/entry': 'products:manage',
  '/products/variants': 'products:variants',
  '/products/flavors': 'products:flavors',
  '/products/sizes': 'products:sizes',
  '/production': 'production:read',
  '/production/batches': 'production:batches',
  '/production/finished-products': 'production:finished',
  '/finance': 'finance:read',
  '/finance/transactions': 'finance:manage',
  '/tasks': 'tasks:read',
  '/admin': 'admin:access',
  '/admin/employees': 'employees:manage',
  '/admin/roles': 'roles:manage',
};

export function hasPermission(userPermissions: string[], required: PermissionValue, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return userPermissions.includes(required);
}

export function getRequiredPermission(path: string): PermissionValue | null {
  const matchedPath = Object.keys(SIDEBAR_PERMISSION_MAP)
    .sort((a, b) => b.length - a.length)
    .find(p => path.startsWith(p));
    
  return matchedPath ? SIDEBAR_PERMISSION_MAP[matchedPath] : null;
}