"use client";
import { useAuth } from "@/contexts/auth-context";

export function PermissionGuard({ 
  permission, 
  children 
}: { 
  permission: string; 
  children: React.ReactNode 
}) {
  const { permissions, role } = useAuth();
  
  // Admin ko sab kuch dikhao, baki ke liye DB permissions check karo
  if (role === 'admin' || permissions.includes(permission)) {
    return <>{children}</>;
  }
  
  return null;
}