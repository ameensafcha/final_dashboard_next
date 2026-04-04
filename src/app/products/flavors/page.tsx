"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Edit, Trash2, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";

async function fetchFlavors() {
  const res = await fetch("/api/flavors");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchRawMaterials() {
  const res = await fetch("/api/raw-materials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Ingredient {
  id: string;
  raw_material_id: number;
  raw_material: {
    id: number;
    name: string;
  };
}

interface Flavor {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
  ingredients: Ingredient[];
}

interface RawMaterial {
  id: number;
  name: string;
}

interface LinkedProduct {
  id: string;
  name: string;
  sku: string;
}

interface DeleteError extends Error {
  linkedProducts?: LinkedProduct[];
}

export default function FlavorsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [editFlavor, setEditFlavor] = useState<Flavor | null>(null);
  const [viewFlavor, setViewFlavor] = useState<Flavor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkedProducts, setLinkedProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    ingredient_ids: [] as number[],
    is_active: true,
  });

  const { data: flavors, isLoading } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
    refetchInterval: 5000,
  });

  const generateShortCode = (name: string): string => {
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const generatedCode = generateShortCode(newName);
    setFormData(prev => ({
      ...prev,
      name: newName,
      short_code: !editFlavor && generatedCode ? generatedCode : prev.short_code
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; short_code: string; ingredient_ids: number[] }) => {
      const res = await fetch("/api/flavors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setOpen(false);
      setFormData({ name: "", short_code: "", ingredient_ids: [], is_active: true });
      addNotification({ type: "success", message: "Flavor added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add flavor" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; short_code: string; is_active: boolean; ingredient_ids: number[] }) => {
      const res = await fetch("/api/flavors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setOpen(false);
      setEditFlavor(null);
      setFormData({ name: "", short_code: "", ingredient_ids: [], is_active: true });
      addNotification({ type: "success", message: "Flavor updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/flavors?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.error || "Failed to delete") as DeleteError;
        error.linkedProducts = data.linkedProducts || [];
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setLinkedProducts([]);
      addNotification({ type: "success", message: "Flavor deleted successfully!" });
    },
    onError: (error: Error) => {
      const linked = (error as DeleteError).linkedProducts || [];
      setLinkedProducts(linked);
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFlavor) {
      updateMutation.mutate({ id: editFlavor.id, name: formData.name, short_code: formData.short_code, is_active: formData.is_active, ingredient_ids: formData.ingredient_ids });
    } else {
      createMutation.mutate({ name: formData.name, short_code: formData.short_code, ingredient_ids: formData.ingredient_ids });
    }
  };

  const handleEdit = (flavor: Flavor) => {
    setEditFlavor(flavor);
    setFormData({
      name: flavor.name,
      short_code: flavor.short_code,
      ingredient_ids: flavor.ingredients.map(i => i.raw_material_id),
      is_active: flavor.is_active,
    });
    setOpen(true);
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setOpen(false);
      setEditFlavor(null);
      setFormData({ name: "", short_code: "", ingredient_ids: [], is_active: true });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
    </div>
  );

  const flavorsList: Flavor[] = flavors || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Flavors</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Manage product flavors</p>
        </div>
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Flavor
        </button>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAF5FF" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Short Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Ingredients</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flavorsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" }}
              >
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#4C1D95" }}>{item.name}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: "#7C3AED" }}>{item.short_code}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>
                  {item.ingredients?.length || 0} ingredient(s)
                </td>
                <td className="px-4 py-3">
                  <button 
                    className="px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80"
                    style={{ 
                      backgroundColor: item.is_active ? "#DCFCE7" : "#FEE2E2",
                      color: item.is_active ? "#16A34A" : "#DC2626"
                    }}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewFlavor(item)}
                      className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-100 cursor-pointer"
                      style={{ color: "#7C3AED", backgroundColor: "#FAF5FF" }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-purple-100 cursor-pointer" 
                      style={{ color: "#7C3AED" }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-red-100 cursor-pointer" 
                      style={{ color: "#DC2626" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {flavorsList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No flavors found</p>
                    <p className="text-sm" style={{ color: "#A78BFA" }}>Add your first flavor</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>
              {editFlavor ? "Edit Flavor" : "Add Flavor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Chocolate, Vanilla, Strawberry"
                required
                style={{ borderColor: "#7C3AED20" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Short Code (Auto-generated)</label>
              <Input
                type="text"
                value={formData.short_code}
                onChange={(e) => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                placeholder="e.g., CH, OG, VAN"
                maxLength={5}
                required
                style={{ borderColor: "#7C3AED20" }}
              />
              <p className="text-xs mt-1" style={{ color: "#A78BFA" }}>First 2 letters of first 2 words</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Ingredients (Raw Materials)</label>
              <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto" style={{ borderColor: "#7C3AED20" }}>
                {rawMaterials?.map((rm: RawMaterial) => (
                  <label key={rm.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={formData.ingredient_ids.includes(rm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, ingredient_ids: [...formData.ingredient_ids, rm.id] });
                        } else {
                          setFormData({ ...formData, ingredient_ids: formData.ingredient_ids.filter((id) => id !== rm.id) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm" style={{ color: "#4C1D95" }}>{rm.name}</span>
                  </label>
                ))}
                {(!rawMaterials || rawMaterials.length === 0) && (
                  <p className="text-sm" style={{ color: "#A78BFA" }}>No raw materials available</p>
                )}
              </div>
            </div>
            {editFlavor && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: "#4C1D95" }}>Status</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: formData.is_active ? "#7C3AED" : "#DC2626" }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: formData.is_active ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={() => setOpen(false)} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: "#7C3AED", color: "white" }}
              >
                {editFlavor ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Saving..." : "Save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setLinkedProducts([]); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>Delete Flavor</DialogTitle>
          </DialogHeader>
          {linkedProducts.length > 0 ? (
            <div className="space-y-3">
              <p style={{ color: "#DC2626" }}>
                This flavor is linked to {linkedProducts.length} product(s). Please delete them first:
              </p>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2" style={{ borderColor: "#DC262620" }}>
                {linkedProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#FEE2E2" }}>
                    <span className="text-sm font-medium" style={{ color: "#4C1D95" }}>{p.name}</span>
                    <span className="text-xs font-mono" style={{ color: "#A78BFA" }}>{p.sku}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#4C1D95" }}>
              Are you sure you want to delete this flavor?
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => { setDeleteOpen(false); setLinkedProducts([]); }} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
              Cancel
            </Button>
            {linkedProducts.length === 0 && (
              <Button 
                onClick={handleDelete} 
                disabled={deleteMutation.isPending}
                style={{ backgroundColor: "#DC2626", color: "white" }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewFlavor} onOpenChange={() => setViewFlavor(null)}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95", fontSize: "1.5rem", fontWeight: "bold" }}>
              {viewFlavor?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewFlavor && (
            <div className="space-y-4">
              {/* SKU & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm" style={{ color: "#A78BFA" }}>
                  {viewFlavor.short_code}
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: viewFlavor.is_active ? "#DCFCE7" : "#FEE2E2",
                    color: viewFlavor.is_active ? "#16A34A" : "#DC2626"
                  }}
                >
                  {viewFlavor.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Ingredients */}
              <div>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#A78BFA" }}>Ingredients</p>
                {viewFlavor.ingredients && viewFlavor.ingredients.length > 0 ? (
                  <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: "#FAF5FF" }}>
                    {viewFlavor.ingredients.map((ing) => (
                      <div key={ing.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7C3AED" }}></span>
                        <span className="text-sm font-medium" style={{ color: "#4C1D95" }}>
                          {ing.raw_material.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "#A78BFA" }}>No ingredients selected</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
