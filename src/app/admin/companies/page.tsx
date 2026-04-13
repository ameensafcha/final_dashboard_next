"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Check, X, Loader2, Building2 } from "lucide-react";
import { useUIStore } from "@/lib/stores";

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

export default function CompaniesAdminPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: companies, isLoading } = useQuery<{ data: Company[] }>({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      return res.json();
    },
  });

  const companiesList = companies?.data || [];

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setNewName("");
      setIsAdding(false);
      addNotification({ type: "success", message: "Company added successfully" });
    },
    onError: (error: any) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, is_active }: Partial<Company> & { id: string }) => {
      const res = await fetch("/api/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, is_active }),
      });
      if (!res.ok) throw new Error("Failed to update company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setEditingId(null);
      addNotification({ type: "success", message: "Company updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete company");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      addNotification({ type: "success", message: "Company deleted" });
    },
    onError: (error: any) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#E8C547]" />
            Company Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage companies for task association</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8C547]" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Company Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isAdding && (
                <tr className="bg-amber-50/30">
                  <td className="px-6 py-4">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter company name..."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#E8C547]/20 focus:border-[#E8C547]"
                      onKeyDown={(e) => e.key === "Enter" && createMutation.mutate(newName)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => createMutation.mutate(newName)}
                        disabled={createMutation.isPending || !newName.trim()}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {companiesList.map((company) => (
                <tr key={company.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === company.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#E8C547]/20"
                        onKeyDown={(e) => e.key === "Enter" && updateMutation.mutate({ id: company.id, name: editName })}
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-700">{company.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === company.id ? (
                        <>
                          <button 
                            onClick={() => updateMutation.mutate({ id: company.id, name: editName })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setEditingId(company.id); setEditName(company.name); }}
                            className="p-2 text-gray-400 hover:text-[#E8C547] hover:bg-[#E8C547]/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(company.id); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {companiesList.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-400 text-sm font-medium">
                    No companies found. Add your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}