"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// List of available permissions in your system
const AVAILABLE_PERMISSIONS = [
  "edit:dashboard",
  "view:stocks",
  "manage:employees",
  "manage:batches",
  "view:finance",
  "delete:records"
];

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // 1. Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetch("/api/roles").then(res => res.json())
  });

  // 2. Fetch permissions for the selected role
  const { data: rolePermissions, isLoading: permsLoading } = useQuery({
    queryKey: ["role-permissions", selectedRole],
    queryFn: async () => {
      const res = await fetch(`/api/auth/employee`); // Using existing employee endpoint that includes permissions
      const data = await res.json();
      return data.role?.permissions || [];
    },
    enabled: !!selectedRole
  });

  // 3. Mutation to toggle permission
  const togglePermission = useMutation({
    mutationFn: async ({ permission, active }: { permission: string, active: boolean }) => {
      const res = await fetch("/api/roles/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRole, permission, active })
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    }
  });

  if (rolesLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-amber-600" /> Role Permissions
        </h1>
        <p className="text-slate-500">Configure what each role is allowed to do</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Role Selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-400 uppercase">Select Role</p>
          {roles?.map((role: any) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                selectedRole === role.id 
                ? "border-amber-500 bg-amber-50 text-amber-900 font-bold" 
                : "border-slate-100 hover:border-amber-200 text-slate-600"
              }`}
            >
              {role.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main: Permissions Checklist */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {!selectedRole ? (
            <div className="p-20 text-center text-slate-400">
              Please select a role from the left to manage its permissions.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700 uppercase tracking-wider text-sm">
                  System Permissions
                </h3>
              </div>
              
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isActive = rolePermissions?.some((rp: any) => rp.permission === perm && rp.is_active);
                
                return (
                  <div key={perm} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-800 uppercase text-sm">{perm.replace(':', ' ')}</p>
                      <p className="text-xs text-slate-500 italic">Access to {perm} functionality</p>
                    </div>
                    
                    <Button
                      variant={isActive ? "default" : "outline"}
                      onClick={() => togglePermission.mutate({ permission: perm, active: !isActive })}
                      disabled={togglePermission.isPending}
                      className={isActive ? "bg-emerald-500 hover:bg-emerald-600" : "border-slate-200"}
                    >
                      {isActive ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <XCircle className="w-4 h-4 mr-2"/>}
                      {isActive ? "Allowed" : "Denied"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}