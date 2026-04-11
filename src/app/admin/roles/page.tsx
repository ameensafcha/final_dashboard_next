"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Settings2, CheckCircle2, XCircle } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  permissions?: { permission: string; is_active: boolean }[];
}

const AVAILABLE_PERMISSIONS = [
  "edit:dashboard",
  "view:stocks",
  "manage:employees",
  "manage:batches",
  "view:finance",
  "delete:records"
];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; description: string }) => {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData),
      });
      if (!res.ok) throw new Error("Failed to create role");
      return res.json();
    },
    onSuccess: () => {
      alert("Role successfully created");
      setNewRoleName("");
      setNewRoleDesc("");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const togglePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permission, active }: { roleId: string; permission: string; active: boolean }) => {
      const res = await fetch("/api/roles/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, permission, active }),
      });
      if (!res.ok) throw new Error("Failed to update permission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        </div>
        <p className="text-slate-500">Create roles and manage their system-wide permissions</p>
      </div>

      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg border-2 border-amber-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-amber-900">Create New Role</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          createRoleMutation.mutate({ name: newRoleName, description: newRoleDesc });
        }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. manager" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Responsibility" />
          </div>
          <Button disabled={!newRoleName || createRoleMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
            Add Role
          </Button>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Role Name</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles?.map((role) => (
              <tr key={role.id} className={`hover:bg-amber-50/40 transition-colors ${editingRole?.id === role.id ? 'bg-amber-50' : ''}`}>
                <td className="px-6 py-4 font-medium text-slate-900 uppercase">{role.name}</td>
                <td className="px-6 py-4 text-slate-600 italic">{role.description || 'N/A'}</td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-amber-200 text-amber-700 hover:bg-amber-100"
                    onClick={() => setEditingRole(editingRole?.id === role.id ? null : role)}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    Permissions
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Toggle Section (Dynamic) */}
      {editingRole && (
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="text-amber-400" /> 
              Permissions for: <span className="text-amber-400 uppercase">{editingRole.name}</span>
            </h3>
            <Button variant="ghost" className="text-white hover:bg-slate-800" onClick={() => setEditingRole(null)}>Close</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_PERMISSIONS.map((perm) => {
              // Check if role currently has this permission active
              const isActive = editingRole.permissions?.some(p => p.permission === perm && p.is_active);
              
              return (
                <div key={perm} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-sm font-medium uppercase">{perm.replace(':', ' ')}</span>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className={isActive ? "bg-emerald-500 hover:bg-emerald-600 border-none" : "text-slate-400 border-slate-600"}
                    onClick={() => togglePermissionMutation.mutate({ 
                      roleId: editingRole.id, 
                      permission: perm, 
                      active: !isActive 
                    })}
                  >
                    {isActive ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                    {isActive ? "Allowed" : "Denied"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}