"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";

async function fetchVariants() {
  const res = await fetch("/api/variants");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchSizes() {
  const res = await fetch("/api/sizes");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
}

interface Flavor {
  id: string;
  name: string;
  short_code: string;
}

interface ProductFlavor {
  flavor: Flavor;
}

interface Product {
  id: string;
  name: string;
  product_flavors: ProductFlavor[];
}

interface Variant {
  id: string;
  product_id: string;
  size_id: string;
  price: number;
  description: string | null;
  sku: string;
  is_active: boolean;
  product: Product;
  size: Size;
}

export default function VariantsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [viewVariant, setViewVariant] = useState<Variant | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: "",
    size_id: "",
    price: "",
    description: "",
  });

  const { data: variants, isLoading } = useQuery({
    queryKey: ["variants"],
    queryFn: fetchVariants,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: sizes } = useQuery({
    queryKey: ["sizes"],
    queryFn: fetchSizes,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      setOpen(false);
      resetForm();
      addNotification({ type: "success", message: "Variant added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add variant" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; price: string; description: string; is_active: boolean }) => {
      const res = await fetch("/api/variants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      setOpen(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      addNotification({ type: "success", message: "Variant updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/variants?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Variant deleted successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch("/api/variants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      addNotification({ type: "success", message: "Status updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update status" });
    },
  });

  const resetForm = () => {
    setFormData({ product_id: "", size_id: "", price: "", description: "" });
    setEditMode(false);
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.size_id) {
      addNotification({ type: "error", message: "Please fill required fields" });
      return;
    }

    if (editMode && editId) {
      updateMutation.mutate({ ...formData, id: editId, is_active: true });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (variant: Variant) => {
    setFormData({
      product_id: variant.product_id,
      size_id: variant.size_id,
      price: String(variant.price),
      description: variant.description || "",
    });
    setEditMode(true);
    setEditId(variant.id);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setViewVariant(null);
    setEditMode(false);
    setEditId(null);
    resetForm();
  };

  const handleToggleStatus = (variant: Variant) => {
    toggleStatusMutation.mutate({ id: variant.id, is_active: !variant.is_active });
  };

  const getFlavorNames = (variant: Variant) => {
    return variant.product.product_flavors.map(pf => pf.flavor.name).join(", ");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
    </div>
  );

  const variantsList: Variant[] = variants || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Variants</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Manage product variants</p>
        </div>
        <button 
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAF5FF" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Flavors</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Size</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variantsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" }}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#4C1D95" }}>{item.product.name}</p>
                  <p className="text-xs" style={{ color: "#A78BFA" }}>{item.sku}</p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>{getFlavorNames(item)}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>{item.size.size} {item.size.unit}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#7C3AED" }}>{item.price} SAR</td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => handleToggleStatus(item)}
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
                      onClick={() => setViewVariant(item)}
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
            {variantsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No variants found</p>
                    <p className="text-sm" style={{ color: "#A78BFA" }}>Add your first variant</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View/Add/Edit Dialog */}
      <Dialog open={open || !!viewVariant} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>
              {viewVariant && !editMode ? "Variant Details" : editMode ? "Edit Variant" : "Add Variant"}
            </DialogTitle>
          </DialogHeader>
          
          {viewVariant && !editMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "#4C1D95" }}>{viewVariant.product.name}</h3>
                  <p className="text-sm" style={{ color: "#A78BFA" }}>{viewVariant.sku}</p>
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: viewVariant.is_active ? "#DCFCE7" : "#FEE2E2",
                    color: viewVariant.is_active ? "#16A34A" : "#DC2626"
                  }}
                >
                  {viewVariant.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#A78BFA" }}>Flavors</p>
                  <p className="text-sm" style={{ color: "#4C1D95" }}>{getFlavorNames(viewVariant)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#A78BFA" }}>Size</p>
                  <p className="text-sm" style={{ color: "#4C1D95" }}>{viewVariant.size.size} {viewVariant.size.unit}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#A78BFA" }}>Price</p>
                  <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>{viewVariant.price} SAR</p>
                </div>
              </div>

              {viewVariant.description && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#A78BFA" }}>Description</p>
                  <p className="text-sm" style={{ color: "#4C1D95" }}>{viewVariant.description}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button onClick={() => { setEditMode(true); handleEdit(viewVariant); }} style={{ backgroundColor: "#7C3AED", color: "white" }}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#7C3AED20" }}
                  disabled={editMode}
                >
                  <option value="">Select Product</option>
                  {(products || []).map((p: Product) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Size *</label>
                <select
                  value={formData.size_id}
                  onChange={(e) => setFormData({ ...formData, size_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#7C3AED20" }}
                  disabled={editMode}
                >
                  <option value="">Select Size</option>
                  {(sizes || []).map((s: Size) => (
                    <option key={s.id} value={s.id}>{s.size} {s.unit} ({s.pack_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Price (SAR) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                  style={{ borderColor: "#7C3AED20" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: "#7C3AED20" }}
                />
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" onClick={handleClose} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ backgroundColor: "#7C3AED", color: "white" }}
                >
                  {editMode ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Creating..." : "Create")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>Delete Variant</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#4C1D95" }}>
            Are you sure you want to delete this variant?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setDeleteOpen(false)} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={deleteMutation.isPending}
              style={{ backgroundColor: "#DC2626", color: "white" }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
