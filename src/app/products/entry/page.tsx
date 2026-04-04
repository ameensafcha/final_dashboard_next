"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchFlavors() {
  const res = await fetch("/api/flavors");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Flavor {
  id: string;
  name: string;
  short_code: string;
  ingredients?: {
    id: string;
    raw_material: {
      name: string;
    };
  }[];
}

interface ProductFlavor {
  id: string;
  flavor: Flavor;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  product_flavors: ProductFlavor[];
}

export default function ProductEntryPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    flavor_ids: [] as string[],
    is_active: true,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: flavors } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/products", {
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      resetForm();
      addNotification({ type: "success", message: "Product added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add product" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; flavor_ids: string[]; is_active: boolean }) => {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      addNotification({ type: "success", message: "Product updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Product deleted successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addNotification({ type: "success", message: "Status updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update status" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", flavor_ids: [], is_active: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.flavor_ids.length === 0) {
      addNotification({ type: "error", message: "Please fill required fields" });
      return;
    }

    if (editMode && editId) {
      updateMutation.mutate({ ...formData, id: editId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      flavor_ids: product.product_flavors.map(pf => pf.flavor.id),
      is_active: product.is_active,
    });
    setEditMode(true);
    setEditId(product.id);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setViewProduct(null);
    setEditMode(false);
    setEditId(null);
    resetForm();
  };

  const handleToggleStatus = (product: Product) => {
    toggleStatusMutation.mutate({ id: product.id, is_active: !product.is_active });
  };

  const handleFlavorToggle = (flavorId: string) => {
    setFormData(prev => ({
      ...prev,
      flavor_ids: prev.flavor_ids.includes(flavorId)
        ? prev.flavor_ids.filter(id => id !== flavorId)
        : [...prev.flavor_ids, flavorId]
    }));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
    </div>
  );

  const productsList: Product[] = products || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Product</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Manage your products</p>
        </div>
        <button 
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Product
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
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" }}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#4C1D95" }}>{item.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#7C3AED", color: "white" }}
                  >
                    {item.product_flavors?.length || 0}
                  </span>
                </td>
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
                      onClick={() => setViewProduct(item)}
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
            {productsList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No products found</p>
                    <p className="text-sm" style={{ color: "#A78BFA" }}>Add your first product</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View/Add/Edit Dialog */}
      <Dialog open={open || !!viewProduct} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>
              {viewProduct && !editMode ? "Product Details" : editMode ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          
          {viewProduct && !editMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "#4C1D95" }}>{viewProduct.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {viewProduct.product_flavors?.map((pf) => (
                      <span 
                        key={pf.id} 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: "#7C3AED",
                          color: "white"
                        }}
                      >
                        {pf.flavor.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: viewProduct.is_active ? "#DCFCE7" : "#FEE2E2",
                    color: viewProduct.is_active ? "#16A34A" : "#DC2626"
                  }}
                >
                  {viewProduct.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {viewProduct.description && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#A78BFA" }}>Description</p>
                  <p className="text-sm" style={{ color: "#4C1D95" }}>{viewProduct.description}</p>
                </div>
              )}

              {viewProduct.product_flavors?.some(pf => pf.flavor.ingredients?.length) && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#A78BFA" }}>Ingredients</p>
                  {viewProduct.product_flavors?.filter(pf => pf.flavor.ingredients?.length).map((pf) => (
                    <div key={pf.id} className="mb-2">
                      <p className="text-xs font-medium" style={{ color: "#7C3AED" }}>{pf.flavor.name}:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pf.flavor.ingredients?.map((ing) => (
                          <span key={ing.id} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "#FAF5FF", color: "#4C1D95" }}>
                            {ing.raw_material.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button onClick={() => { setEditMode(true); handleEdit(viewProduct); }} style={{ backgroundColor: "#7C3AED", color: "white" }}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Product Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ice Cream"
                  required
                  style={{ borderColor: "#7C3AED20" }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#4C1D95" }}>Flavors *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(flavors || []).map((f: Flavor) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFlavorToggle(f.id)}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: formData.flavor_ids.includes(f.id) ? "#7C3AED" : "#FAF5FF",
                        color: formData.flavor_ids.includes(f.id) ? "white" : "#4C1D95",
                        border: formData.flavor_ids.includes(f.id) ? "none" : "1px solid #7C3AED20"
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                {formData.flavor_ids.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: "#DC2626" }}>Select at least one flavor</p>
                )}
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
                <span className="text-sm" style={{ color: formData.is_active ? "#16A34A" : "#DC2626" }}>
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
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
                  {editMode ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Saving..." : "Create")}
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
            <DialogTitle style={{ color: "#4C1D95" }}>Delete Product</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#4C1D95" }}>
            Are you sure you want to delete this product?
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
