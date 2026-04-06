"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ShoppingBag, Package, DollarSign, CheckCircle, XCircle, LayoutGrid, List } from "lucide-react";
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
  ingredients?: string;
}

interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
}

interface Variant {
  id: string;
  product_id: string;
  flavor_id: string;
  size_id: string;
  price: number;
  description: string | null;
  sku: string;
  is_active: boolean;
  flavor: Flavor;
  size: Size;
}

interface ProductFlavor {
  id: string;
  flavor: Flavor;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  product_flavors: ProductFlavor[];
  variants: Variant[];
  variants_count?: {
    active: number;
    inactive: number;
    total: number;
  };
}

export default function ProductEntryPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "variants" | "ingredients">("overview");
  const [variantViewMode, setVariantViewMode] = useState<"grid" | "list">("grid");
  const [selectedFlavorForIngredients, setSelectedFlavorForIngredients] = useState<string | null>(null);
  const [selectedFlavorForVariants, setSelectedFlavorForVariants] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    flavor_ids: [] as string[],
    is_active: true,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchInterval: 5000,
  });

  const viewProduct = viewProductId ? (products?.find((p: Product) => p.id === viewProductId) ?? null) : null;

  useEffect(() => {
    if (activeTab === "ingredients" && viewProduct?.product_flavors?.length > 0) {
      if (!selectedFlavorForIngredients) {
        setSelectedFlavorForIngredients(viewProduct.product_flavors[0].flavor.id);
      }
    } else if (activeTab !== "ingredients") {
      setSelectedFlavorForIngredients(null);
    }
  }, [activeTab, viewProduct, selectedFlavorForIngredients]);

  useEffect(() => {
    if (activeTab === "variants" && viewProduct?.product_flavors?.length > 0) {
      if (!selectedFlavorForVariants) {
        setSelectedFlavorForVariants(viewProduct.product_flavors[0].flavor.id);
      }
    } else if (activeTab !== "variants") {
      setSelectedFlavorForVariants(null);
    }
  }, [activeTab, viewProduct, selectedFlavorForVariants]);

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

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, price, is_active }: { id: string; price: number; is_active: boolean }) => {
      const res = await fetch("/api/variants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price, is_active }),
      });
      if (!res.ok) throw new Error("Failed to update variant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      setEditingPrice(null);
      setPriceInput("");
      addNotification({ type: "success", message: "Variant updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update variant" });
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
    setViewProductId(null);
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
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const productsList: Product[] = products || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Product</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage your products</p>
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
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavors</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Active</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Inactive</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{item.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#E8C547", color: "white" }}
                  >
                    {item.product_flavors?.length || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                  >
                    {item.variants_count?.active || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                  >
                    {item.variants_count?.inactive || 0}
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
                      onClick={() => setViewProductId(item.id)}
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
            {productsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No products found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Add your first product</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View/Add/Edit Dialog */}
      <Dialog open={open || !!viewProduct} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "800px", height: "90vh", display: "flex", flexDirection: "column" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              {viewProduct && !editMode ? "Product Details" : editMode ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          
          {viewProduct && !editMode ? (
            <div className="flex-1 overflow-auto scrollbar-hide space-y-4">
              {/* Header Section */}
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#F5F4EE" }}>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{viewProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm" style={{ color: "#C9A83A" }}>
                      {viewProduct.product_flavors?.length || 0} Flavors
                    </span>
                    <span style={{ color: "#C9A83A" }}>•</span>
                    <span className="text-sm" style={{ color: "#16A34A" }}>
                      {viewProduct.variants_count?.active || 0} Active
                    </span>
                    <span style={{ color: "#C9A83A" }}>•</span>
                    <span className="text-sm" style={{ color: "#DC2626" }}>
                      {viewProduct.variants_count?.inactive || 0} Inactive
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => { setEditMode(true); handleEdit(viewProduct); }} style={{ backgroundColor: "#E8C547", color: "white" }}>
                    Edit Product
                  </Button>
                  <span 
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: viewProduct.is_active ? "#DCFCE7" : "#FEE2E2",
                      color: viewProduct.is_active ? "#16A34A" : "#DC2626"
                    }}
                  >
                    {viewProduct.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "#F5F4EE" }}>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: activeTab === "overview" ? "#FFFFFF" : "transparent",
                    color: activeTab === "overview" ? "#E8C547" : "#C9A83A",
                    boxShadow: activeTab === "overview" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("variants")}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: activeTab === "variants" ? "#FFFFFF" : "transparent",
                    color: activeTab === "variants" ? "#E8C547" : "#C9A83A",
                    boxShadow: activeTab === "variants" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Flavors & Variants
                </button>
                <button
                  onClick={() => setActiveTab("ingredients")}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: activeTab === "ingredients" ? "#FFFFFF" : "transparent",
                    color: activeTab === "ingredients" ? "#E8C547" : "#C9A83A",
                    boxShadow: activeTab === "ingredients" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Ingredients
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {viewProduct.description && (
                    <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54720" }}>
                      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#C9A83A" }}>Description</p>
                      <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewProduct.description}</p>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border text-center cursor-pointer hover:shadow-md transition-all" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
                      <p className="text-2xl font-bold" style={{ color: "#E8C547" }}>{viewProduct.product_flavors?.length || 0}</p>
                      <p className="text-xs" style={{ color: "#C9A83A" }}>Flavors</p>
                    </div>
                    <div className="p-4 rounded-xl border text-center cursor-pointer hover:shadow-md transition-all" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
                      <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{viewProduct.variants_count?.active || 0}</p>
                      <p className="text-xs" style={{ color: "#16A34A" }}>Active Variants</p>
                    </div>
                    <div className="p-4 rounded-xl border text-center cursor-pointer hover:shadow-md transition-all" style={{ borderColor: "#DC262630", backgroundColor: "#FEF2F2" }}>
                      <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>{viewProduct.variants_count?.inactive || 0}</p>
                      <p className="text-xs" style={{ color: "#DC2626" }}>Inactive</p>
                    </div>
                  </div>

                  {/* Flavor List */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A1A1A" }}>Flavors</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewProduct.product_flavors?.map((pf: ProductFlavor) => {
                        const variantCount = viewProduct.variants?.filter((v: Variant) => v.flavor_id === pf.flavor.id).length || 0;
                        return (
                          <div 
                            key={pf.id} 
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                            style={{ borderColor: "#E8C54730", backgroundColor: "#FFFFFF" }}
                          >
                            <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{pf.flavor.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5F4EE", color: "#C9A83A" }}>{variantCount} variants</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === "variants" && (
                <div className="space-y-4">
                  {/* View Toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Showing {viewProduct.product_flavors?.length} flavors</p>
                    <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: "#F5F4EE" }}>
                      <button
                        onClick={() => setVariantViewMode("grid")}
                        className="p-1.5 rounded-md cursor-pointer transition-all"
                        style={{ 
                          backgroundColor: variantViewMode === "grid" ? "#FFFFFF" : "transparent",
                          color: variantViewMode === "grid" ? "#E8C547" : "#C9A83A"
                        }}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setVariantViewMode("list")}
                        className="p-1.5 rounded-md cursor-pointer transition-all"
                        style={{ 
                          backgroundColor: variantViewMode === "list" ? "#FFFFFF" : "transparent",
                          color: variantViewMode === "list" ? "#E8C547" : "#C9A83A"
                        }}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Flavor Buttons Row */}
                  <div className="flex flex-wrap gap-2">
                    {viewProduct.product_flavors?.map((pf: ProductFlavor) => {
                      const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === pf.flavor.id) || [];
                      const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
                      return (
                        <button
                          key={pf.id}
                          type="button"
                          onClick={() => setSelectedFlavorForVariants(pf.flavor.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                          style={{ 
                            backgroundColor: selectedFlavorForVariants === pf.flavor.id ? "#E8C547" : "#F5F4EE",
                            color: selectedFlavorForVariants === pf.flavor.id ? "white" : "#1A1A1A",
                            border: selectedFlavorForVariants === pf.flavor.id ? "none" : "1px solid #E8C54730"
                          }}
                        >
                          {pf.flavor.name} ({pf.flavor.short_code})
                          <span className="ml-2 text-xs opacity-75">({activeCount})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Flavor Variants */}
                  {selectedFlavorForVariants && (() => {
                    const selectedPF = viewProduct.product_flavors.find((pf: ProductFlavor) => pf.flavor.id === selectedFlavorForVariants);
                    const selectedFlavorData = selectedPF?.flavor;
                    const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === selectedFlavorForVariants) || [];
                    const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
                    const inactiveCount = flavorVariants.filter((v: Variant) => !v.is_active).length;
                    
                    return (
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8C54730" }}>
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: "#F5F4EE" }}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>{selectedFlavorData?.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8C54720", color: "#E8C547" }}>{selectedFlavorData?.short_code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>{activeCount} Active</span>
                            <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{inactiveCount} Inactive</span>
                          </div>
                        </div>
                        
                        <div className="p-3" style={{ backgroundColor: "#FFFFFF" }}>
                          {flavorVariants.length > 0 ? (
                            variantViewMode === "grid" ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {flavorVariants.map((variant: Variant) => (
                                  <div
                                    key={variant.id}
                                    onClick={() => { setEditingPrice(variant.id); setPriceInput(variant.price.toString()); }}
                                    className="p-3 rounded-lg border text-center cursor-pointer hover:shadow-md transition-all group"
                                    style={{ 
                                      borderColor: variant.is_active ? "#16A34A30" : "#DC262630",
                                      backgroundColor: variant.is_active ? "#F0FDF4" : "#FEF2F2"
                                    }}
                                  >
                                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{variant.size.size} {variant.size.unit}</p>
                                    <p className="text-xs mb-2" style={{ color: "#6B7280" }}>{variant.size.pack_type}</p>
                                    {editingPrice === variant.id ? (
                                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="number"
                                          value={priceInput}
                                          onChange={(e) => setPriceInput(e.target.value)}
                                          className="w-16 px-2 py-1 text-xs text-center rounded border"
                                          style={{ borderColor: "#E8C547" }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => updateVariantMutation.mutate({ 
                                            id: variant.id, 
                                            price: parseFloat(priceInput) || 0, 
                                            is_active: parseFloat(priceInput) > 0 
                                          })}
                                          className="p-1 rounded bg-green-500 text-white cursor-pointer"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => { setEditingPrice(null); setPriceInput(""); }}
                                          className="p-1 rounded bg-gray-400 text-white cursor-pointer"
                                        >
                                          <XCircle className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1">
                                        <p className="text-sm font-bold" style={{ color: variant.price > 0 ? "#E8C547" : "#DC2626" }}>
                                          {variant.price > 0 ? `${variant.price} SAR` : "Add Price"}
                                        </p>
                                        {variant.is_active ? (
                                          <CheckCircle className="w-4 h-4" style={{ color: "#16A34A" }} />
                                        ) : (
                                          <DollarSign className="w-4 h-4" style={{ color: "#DC2626" }} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {flavorVariants.map((variant: Variant) => (
                                  <div
                                    key={variant.id}
                                    className="flex items-center justify-between p-2 rounded-lg border"
                                    style={{ borderColor: "#E8C54720" }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{variant.size.size} {variant.size.unit}</span>
                                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>{variant.size.pack_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {editingPrice === variant.id ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            value={priceInput}
                                            onChange={(e) => setPriceInput(e.target.value)}
                                            className="w-20 px-2 py-1 text-sm rounded border"
                                            style={{ borderColor: "#E8C547" }}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => updateVariantMutation.mutate({ 
                                              id: variant.id, 
                                              price: parseFloat(priceInput) || 0, 
                                              is_active: parseFloat(priceInput) > 0 
                                            })}
                                            className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                                            style={{ backgroundColor: "#16A34A", color: "white" }}
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => { setEditingPrice(null); setPriceInput(""); }}
                                            className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                                            style={{ backgroundColor: "#9CA3AF", color: "white" }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="text-sm font-semibold" style={{ color: variant.price > 0 ? "#E8C547" : "#DC2626" }}>
                                            {variant.price > 0 ? `${variant.price} SAR` : "Add Price"}
                                          </span>
                                          <button
                                            onClick={() => { setEditingPrice(variant.id); setPriceInput(variant.price.toString()); }}
                                            className="p-1 rounded cursor-pointer hover:bg-gray-100"
                                          >
                                            <Edit className="w-4 h-4" style={{ color: "#E8C547" }} />
                                          </button>
                                          {variant.is_active ? (
                                            <CheckCircle className="w-5 h-5" style={{ color: "#16A34A" }} />
                                          ) : (
                                            <DollarSign className="w-5 h-5" style={{ color: "#DC2626" }} />
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="text-center py-6">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: "#C9A83A" }} />
                              <p className="text-sm" style={{ color: "#DC2626" }}>No variants generated yet</p>
                              <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>Go to Variants page to generate variants</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Ingredients Tab */}
              {activeTab === "ingredients" && (
                <div className="space-y-4">
                  {viewProduct.product_flavors && viewProduct.product_flavors.length > 0 ? (
                    <>
                      {/* Flavor Buttons Row */}
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.product_flavors.map((pf: ProductFlavor) => (
                          <button
                            key={pf.id}
                            type="button"
                            onClick={() => setSelectedFlavorForIngredients(pf.flavor.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                            style={{ 
                              backgroundColor: selectedFlavorForIngredients === pf.flavor.id ? "#E8C547" : "#F5F4EE",
                              color: selectedFlavorForIngredients === pf.flavor.id ? "white" : "#1A1A1A",
                              border: selectedFlavorForIngredients === pf.flavor.id ? "none" : "1px solid #E8C54730"
                            }}
                          >
                            {pf.flavor.name} ({pf.flavor.short_code})
                          </button>
                        ))}
                      </div>

                      {/* Selected Flavor Ingredients */}
                      {selectedFlavorForIngredients && (() => {
                        const selectedPF = viewProduct.product_flavors.find((pf: ProductFlavor) => pf.flavor.id === selectedFlavorForIngredients);
                        const selectedFlavorData = selectedPF?.flavor;
                        return (
                          <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-semibold" style={{ color: "#1A1A1A" }}>{selectedFlavorData?.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8C54730", color: "#E8C547" }}>
                                {selectedFlavorData?.short_code}
                              </span>
                            </div>
                            {selectedFlavorData?.ingredients ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedFlavorData.ingredients.split(",").map((ing: string, idx: number) => (
                                  <span 
                                    key={idx}
                                    className="px-3 py-1.5 rounded-lg text-sm"
                                    style={{ backgroundColor: "#FFFFFF", color: "#1A1A1A", border: "1px solid #E8C54720" }}
                                  >
                                    {ing.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm" style={{ color: "#C9A83A" }}>No ingredients added for this flavor</p>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: "#C9A83A" }} />
                      <p className="text-sm font-medium" style={{ color: "#C9A83A" }}>No flavors in this product</p>
                      <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>Add flavors to see their ingredients</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Product Name *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Ice Cream"
                    required
                    style={{ borderColor: "#E8C54720" }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Flavors *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(flavors || []).map((f: Flavor) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFlavorToggle(f.id)}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: formData.flavor_ids.includes(f.id) ? "#E8C547" : "#F5F4EE",
                        color: formData.flavor_ids.includes(f.id) ? "white" : "#1A1A1A",
                        border: formData.flavor_ids.includes(f.id) ? "none" : "1px solid #E8C54720"
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
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: "#E8C54720" }}
                />
              </div>

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
                <span className="text-sm" style={{ color: formData.is_active ? "#16A34A" : "#DC2626" }}>
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" onClick={handleClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ backgroundColor: "#E8C547", color: "white" }}
                >
                  {editMode ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Saving..." : "Create")}
                </Button>
              </div>
            </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Product</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#1A1A1A" }}>
            Are you sure you want to delete this product?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setDeleteOpen(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
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
