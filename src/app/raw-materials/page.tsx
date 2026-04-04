"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddMaterialDialog } from "@/components/add-material-dialog";
import { EditMaterialDialog } from "@/components/edit-material-dialog";
import { DeleteConfirmDialog } from "@/components/delete-dialog";
import { Edit, Trash2, Package } from "lucide-react";
import { useState } from "react";

async function fetchMaterials() {
  const res = await fetch("/api/raw-materials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Material {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price_per_kg: number | null;
}

export default function RawMaterialsPage() {
  const queryClient = useQueryClient();
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchMaterials,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/raw-materials?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setDeleteId(null);
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="font-medium" style={{ color: "#DC2626" }}>Error loading materials</p>
    </div>
  );

  const materialsList = data || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Raw Materials</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Manage your inventory materials</p>
        </div>
        <AddMaterialDialog />
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAF5FF" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Price/kg</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materialsList.map((material: Material, index: number) => (
              <tr 
                key={material.id} 
                className="border-t transition-all duration-200"
                style={{ 
                  borderColor: "#7C3AED10",
                  backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" 
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: "#A78BFA" }}>#{material.id}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#4C1D95" }}>{material.name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>{material.quantity} {material.unit}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: material.price_per_kg ? "#7C3AED" : "#A78BFA" }}>
                  {material.price_per_kg ? `$${material.price_per_kg}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditMaterial(material)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-purple-100 cursor-pointer"
                      style={{ color: "#7C3AED" }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(material.id)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-100 cursor-pointer"
                      style={{ color: "#DC2626" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {materialsList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No materials found</p>
                    <p className="text-sm" style={{ color: "#A78BFA" }}>Add your first raw material to get started</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editMaterial && (
        <EditMaterialDialog
          material={editMaterial}
          open={!!editMaterial}
          onOpenChange={(open) => !open && setEditMaterial(null)}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}