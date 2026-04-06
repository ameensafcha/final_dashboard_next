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

interface Flavor {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
  ingredients?: string;
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
  const [ingredientInput, setIngredientInput] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    ingredients: [] as string[],
    is_active: true,
  });

  const { data: flavors, isLoading } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
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
    mutationFn: async (data: { name: string; short_code: string; ingredients: string[] }) => {
      const res = await fetch("/api/flavors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          short_code: data.short_code,
          ingredients: data.ingredients.join(", "),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setOpen(false);
      setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
      addNotification({ type: "success", message: "Flavor added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add flavor" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; short_code: string; ingredients: string; is_active: boolean }) => {
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
      setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
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
    const ingredientsStr = formData.ingredients.join(", ");
    if (editFlavor) {
      updateMutation.mutate({ id: editFlavor.id, name: formData.name, short_code: formData.short_code, ingredients: ingredientsStr, is_active: formData.is_active });
    } else {
      createMutation.mutate({ name: formData.name, short_code: formData.short_code, ingredients: formData.ingredients });
    }
  };

  const handleEdit = (flavor: Flavor) => {
    setEditFlavor(flavor);
    const ingredientList = flavor.ingredients ? flavor.ingredients.split(",").map(i => i.trim()).filter(i => i) : [];
    setFormData({
      name: flavor.name,
      short_code: flavor.short_code,
      ingredients: ingredientList,
      is_active: flavor.is_active,
    });
    setOpen(true);
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setOpen(false);
      setEditFlavor(null);
      setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const flavorsList: Flavor[] = flavors || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Flavors</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage product flavors</p>
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
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Short Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Ingredients</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flavorsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{item.name}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: "#E8C547" }}>{item.short_code}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.ingredients || "—"}</td>
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
                      className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-yellow-100 cursor-pointer"
                      style={{ color: "#E8C547", backgroundColor: "#F5F4EE" }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-yellow-100 cursor-pointer" 
                      style={{ color: "#E8C547" }}
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
                    <Sparkles className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No flavors found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Add your first flavor</p>
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
            <DialogTitle style={{ color: "#1A1A1A" }}>
              {editFlavor ? "Edit Flavor" : "Add Flavor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Chocolate, Vanilla, Strawberry"
                required
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Short Code (Auto-generated)</label>
              <Input
                type="text"
                value={formData.short_code}
                onChange={(e) => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                placeholder="e.g., CH, OG, VAN"
                maxLength={5}
                required
                style={{ borderColor: "#E8C54720" }}
              />
              <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>First 2 letters of first 2 words</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Ingredients</label>
              <div className="space-y-2">
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={ing}
                      onChange={(e) => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[idx] = e.target.value;
                        setFormData({ ...formData, ingredients: newIngredients });
                      }}
                      placeholder="Ingredient name"
                      className="flex-1"
                      style={{ borderColor: "#E8C54720" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newIngredients = formData.ingredients.filter((_, i) => i !== idx);
                        setFormData({ ...formData, ingredients: newIngredients });
                      }}
                      className="px-3 py-2 rounded-lg hover:bg-red-100 cursor-pointer"
                      style={{ color: "#DC2626" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && ingredientInput.trim()) {
                        setFormData({
                          ...formData,
                          ingredients: [...formData.ingredients, ingredientInput.trim()],
                        });
                        setIngredientInput("");
                      }
                    }}
                    placeholder="Type ingredient and press Enter or click Add"
                    className="flex-1"
                    style={{ borderColor: "#E8C54720" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredientInput.trim()) {
                        setFormData({
                          ...formData,
                          ingredients: [...formData.ingredients, ingredientInput.trim()],
                        });
                        setIngredientInput("");
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: "#E8C547" }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>Add ingredients one by one</p>
            </div>
            {editFlavor && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Status</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: formData.is_active ? "#E8C547" : "#DC2626" }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: formData.is_active ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={() => setOpen(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: "#E8C547", color: "white" }}
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
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Flavor</DialogTitle>
          </DialogHeader>
          {linkedProducts.length > 0 ? (
            <div className="space-y-3">
              <p style={{ color: "#DC2626" }}>
                This flavor is linked to {linkedProducts.length} product(s). Please delete them first:
              </p>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2" style={{ borderColor: "#DC262620" }}>
                {linkedProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#FEE2E2" }}>
                    <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{p.name}</span>
                    <span className="text-xs font-mono" style={{ color: "#C9A83A" }}>{p.sku}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#1A1A1A" }}>
              Are you sure you want to delete this flavor?
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => { setDeleteOpen(false); setLinkedProducts([]); }} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
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
            <DialogTitle style={{ color: "#1A1A1A", fontSize: "1.5rem", fontWeight: "bold" }}>
              {viewFlavor?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewFlavor && (
            <div className="space-y-4">
              {/* SKU & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm" style={{ color: "#C9A83A" }}>
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
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#C9A83A" }}>Ingredients</p>
                {viewFlavor.ingredients ? (
                  <div className="flex flex-wrap gap-2">
                    {viewFlavor.ingredients.split(",").map((ing: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ backgroundColor: "#F5F4EE", color: "#1A1A1A" }}
                      >
                        {ing.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "#C9A83A" }}>No ingredients added</p>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
