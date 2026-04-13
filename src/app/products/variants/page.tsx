"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface VariantsResponse {
  data: Variant[];
  pagination: PaginationInfo;
}

async function fetchVariants(page: number, limit: number): Promise<VariantsResponse> {
  const res = await fetch(`/api/variants?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

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

async function fetchSizes() {
  const res = await fetch("/api/sizes");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchAvailableVariants(productId: string) {
  const res = await fetch(`/api/variants/available?product_id=${productId}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
  is_active: boolean;
}

interface Flavor {
  id: string;
  name: string;
  short_code: string;
}

interface Product {
  id: string;
  name: string;
  product_flavors: { flavor: Flavor }[];
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
  product: Product;
  flavor: Flavor;
  size: Size;
}

export default function VariantsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewVariant, setViewVariant] = useState<Variant | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: "",
    flavor_id: "",
    size_id: "",
    price: "",
    description: "",
  });

  const [generateData, setGenerateData] = useState({
    product_id: "",
    flavor_ids: [] as string[],
    size_ids: [] as string[],
  });

  const { data: variantsData, isLoading } = useQuery({
    queryKey: ["variants", page],
    queryFn: () => fetchVariants(page, 50),
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: flavors } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
  });

  const { data: sizes } = useQuery({
    queryKey: ["sizes"],
    queryFn: fetchSizes,
  });

  const { data: availableData } = useQuery({
    queryKey: ["availableVariants", generateData.product_id],
    queryFn: () => fetchAvailableVariants(generateData.product_id),
    enabled: !!generateData.product_id && generateOpen,
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

  const generateMutation = useMutation({
    mutationFn: async (data: typeof generateData) => {
      const res = await fetch("/api/variants/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      setGenerateOpen(false);
      setGenerateData({ product_id: "", flavor_ids: [], size_ids: [] });
      addNotification({ type: "success", message: data.message || "Variants generated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to generate variants" });
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

  const resetForm = () => {
    setFormData({ product_id: "", flavor_id: "", size_id: "", price: "", description: "" });
    setEditMode(false);
    setEditId(null);
  };

  const resetGenerateForm = () => {
    setGenerateData({ product_id: "", flavor_ids: [], size_ids: [] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.flavor_id || !formData.size_id) {
      addNotification({ type: "error", message: "Please fill required fields" });
      return;
    }

    if (editMode && editId) {
      updateMutation.mutate({ ...formData, id: editId, is_active: true });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!generateData.product_id || generateData.flavor_ids.length === 0 || generateData.size_ids.length === 0) {
      addNotification({ type: "error", message: "Please select product, flavors and sizes" });
      return;
    }

    generateMutation.mutate(generateData);
  };

  const handleEdit = (variant: Variant) => {
    setFormData({
      product_id: variant.product_id,
      flavor_id: variant.flavor_id,
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

  const handleToggleFlavor = (flavorId: string) => {
    setGenerateData(prev => ({
      ...prev,
      flavor_ids: prev.flavor_ids.includes(flavorId)
        ? prev.flavor_ids.filter(id => id !== flavorId)
        : [...prev.flavor_ids, flavorId]
    }));
  };

  const handleToggleSize = (sizeId: string) => {
    setGenerateData(prev => ({
      ...prev,
      size_ids: prev.size_ids.includes(sizeId)
        ? prev.size_ids.filter(id => id !== sizeId)
        : [...prev.size_ids, sizeId]
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (variantsData?.pagination.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const getProductFlavors = (productId: string) => {
    const product = (products || []).find((p: Product) => p.id === productId);
    return product?.product_flavors?.map((pf: { flavor: Flavor }) => pf.flavor) || [];
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const variantsList: Variant[] = variantsData?.data || [];
  const pagination = variantsData?.pagination;
  const productFlavors = formData.product_id ? getProductFlavors(formData.product_id) : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Variants</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage product variants</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { resetGenerateForm(); setGenerateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#E8C547", color: "white" }}
          >
            <Package className="w-4 h-4" />
            Generate Variants
          </button>
          <button 
            onClick={() => { resetForm(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#F97316", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
        </div>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Size (Pack)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variantsList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{item.product.name}</p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>{item.sku}</p>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: "#E8C547", color: "white" }}
                  >
                    {item.flavor.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{item.size.size} {item.size.unit}</p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>{item.size.pack_type}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: item.price > 0 ? "#E8C547" : "#DC2626" }}>
                  {item.price > 0 ? `${item.price} SAR` : "-"}
                </td>
                <td className="px-4 py-3">
                  {item.price === 0 ? (
                    <span 
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                    >
                      <AlertCircle className="w-3 h-3" />
                      Add Price
                    </span>
                  ) : (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                    >
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewVariant(item)}
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
            {variantsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No variants found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Generate variants or add manually</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{ color: "#C9A83A" }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 cursor-pointer"
              style={{ color: "#E8C547" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm" style={{ color: "#1A1A1A" }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 cursor-pointer"
              style={{ color: "#E8C547" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate Variants Dialog */}
      <Dialog open={generateOpen} onOpenChange={(isOpen) => { if (!isOpen) { setGenerateOpen(false); resetGenerateForm(); } }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "550px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Generate Variants</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Product *</label>
              <select
                value={generateData.product_id}
                onChange={(e) => setGenerateData({ ...generateData, product_id: e.target.value, flavor_ids: [], size_ids: [] })}
                required
                className="w-full px-3 py-2 rounded-md border"
                style={{ borderColor: "#E8C54720" }}
              >
                <option value="">Select Product</option>
                {(products || []).map((p: Product) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {generateData.product_id && availableData && (
              <>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "#F5F4EE" }}>
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>
                    Already generated: <strong>{availableData.stats.already_generated}</strong> variants
                  </p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>
                    Can generate: <strong>{availableData.stats.can_generate}</strong> new variants
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>
                    Flavors * 
                    <span className="text-xs font-normal" style={{ color: "#C9A83A" }}> (select new ones only)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableData.flavors.map((flavor: { id: string; name: string; is_generated: boolean }) => (
                      <button
                        key={flavor.id}
                        type="button"
                        onClick={() => !flavor.is_generated && handleToggleFlavor(flavor.id)}
                        disabled={flavor.is_generated}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-left transition-all relative"
                        style={{ 
                          backgroundColor: generateData.flavor_ids.includes(flavor.id) ? "#E8C547" : flavor.is_generated ? "#E5E5E5" : "#F5F4EE",
                          color: generateData.flavor_ids.includes(flavor.id) ? "white" : flavor.is_generated ? "#9CA3AF" : "#1A1A1A",
                          border: generateData.flavor_ids.includes(flavor.id) ? "none" : flavor.is_generated ? "1px dashed #D1D5DB" : "1px solid #E8C54720",
                          opacity: flavor.is_generated ? 0.6 : 1,
                          cursor: flavor.is_generated ? "not-allowed" : "pointer"
                        }}
                      >
                        {flavor.name}
                        {flavor.is_generated && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#9CA3AF" }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {availableData.flavors.every((f: { is_generated: boolean }) => f.is_generated) && (
                    <p className="text-xs mt-1" style={{ color: "#16A34A" }}>All flavors already generated!</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>
                    Sizes *
                    <span className="text-xs font-normal" style={{ color: "#C9A83A" }}> (select new ones only)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableData.sizes.map((size: { id: string; size: string; unit: string; pack_type: string; is_generated: boolean }) => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => !size.is_generated && handleToggleSize(size.id)}
                        disabled={size.is_generated}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-left transition-all relative"
                        style={{ 
                          backgroundColor: generateData.size_ids.includes(size.id) ? "#E8C547" : size.is_generated ? "#E5E5E5" : "#F5F4EE",
                          color: generateData.size_ids.includes(size.id) ? "white" : size.is_generated ? "#9CA3AF" : "#1A1A1A",
                          border: generateData.size_ids.includes(size.id) ? "none" : size.is_generated ? "1px dashed #D1D5DB" : "1px solid #E8C54720",
                          opacity: size.is_generated ? 0.6 : 1,
                          cursor: size.is_generated ? "not-allowed" : "pointer"
                        }}
                      >
                        {size.size} {size.unit} ({size.pack_type})
                        {size.is_generated && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#9CA3AF" }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={() => setGenerateOpen(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={generateMutation.isPending || generateData.flavor_ids.length === 0 || generateData.size_ids.length === 0}
                style={{ backgroundColor: "#E8C547", color: "white" }}
              >
                {generateMutation.isPending ? "Generating..." : `Generate (${generateData.flavor_ids.length * generateData.size_ids.length} variants)`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Add/Edit Dialog */}
      <Dialog open={open || !!viewVariant} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              {viewVariant && !editMode ? "Variant Details" : editMode ? "Edit Variant" : "Add Variant"}
            </DialogTitle>
          </DialogHeader>
          
          {viewVariant && !editMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>{viewVariant.product.name}</h3>
                  <p className="text-sm" style={{ color: "#C9A83A" }}>{viewVariant.sku}</p>
                </div>
                {viewVariant.price === 0 ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                    <AlertCircle className="w-3 h-3" /> Add Price
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                    Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#C9A83A" }}>Flavor</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{viewVariant.flavor.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#C9A83A" }}>Size</p>
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewVariant.size.size} {viewVariant.size.unit}</p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>{viewVariant.size.pack_type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#C9A83A" }}>Price</p>
                  <p className="text-sm font-bold" style={{ color: viewVariant.price > 0 ? "#E8C547" : "#DC2626" }}>
                    {viewVariant.price > 0 ? `${viewVariant.price} SAR` : "Not set"}
                  </p>
                </div>
              </div>

              {viewVariant.description && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#C9A83A" }}>Description</p>
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewVariant.description}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button onClick={() => { setEditMode(true); handleEdit(viewVariant); }} style={{ backgroundColor: "#E8C547", color: "white" }}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value, flavor_id: "", size_id: "" })}
                  required
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#E8C54720" }}
                  disabled={editMode}
                >
                  <option value="">Select Product</option>
                  {(products || []).map((p: Product) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {formData.product_id && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Flavor *</label>
                  <select
                    value={formData.flavor_id}
                    onChange={(e) => setFormData({ ...formData, flavor_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-md border"
                    style={{ borderColor: "#E8C54720" }}
                    disabled={editMode}
                  >
                    <option value="">Select Flavor</option>
                    {productFlavors.map((f: Flavor) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Size *</label>
                <select
                  value={formData.size_id}
                  onChange={(e) => setFormData({ ...formData, size_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#E8C54720" }}
                  disabled={editMode}
                >
                  <option value="">Select Size</option>
                  {(sizes || []).filter((s: Size) => s.is_active).map((s: Size) => (
                    <option key={s.id} value={s.id}>{s.size} {s.unit} ({s.pack_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Price (SAR) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                  style={{ borderColor: "#E8C54720" }}
                />
                <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>Setting price will automatically activate the variant</p>
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
              
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" onClick={handleClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ backgroundColor: "#E8C547", color: "white" }}
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
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Variant</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#1A1A1A" }}>
            Are you sure you want to delete this variant?
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
