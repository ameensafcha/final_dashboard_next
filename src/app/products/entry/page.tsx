"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ShoppingBag, Package, CheckCircle, XCircle, LayoutGrid, List, Save, X, Layers, Loader2 } from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { PACKAGING_STATES, LOCATIONS } from "@/lib/sku";
import { format } from "date-fns";

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

async function fetchBatches(variantId: string) {
  const res = await fetch(`/api/product-batches?variant_id=${variantId}`);
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
  grade: string;
  mesh_size: string | null;
  name_arabic: string | null;
  nutritional_values: string | null;
  barcode: string | null;
  sfda_reg_no: string | null;
  shelf_life_months: number | null;
  storage_instructions: string | null;
  flavor: Flavor;
  size: Size;
  inventory?: { quantity: number };
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
  variants_count?: { active: number; inactive: number; total: number };
}

interface Batch {
  id: string;
  batch_id: string;
  quantity: number;
  manufacturing_date: string | null;
  expiry_date: string | null;
  packaging_state: string;
  location: string;
  notes: string | null;
  created_at: string;
}

const defaultBatchForm = {
  quantity: "",
  manufacturing_date: "",
  expiry_date: "",
  packaging_state: PACKAGING_STATES[0],
  location: LOCATIONS[0],
  notes: "",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "variants", label: "Variants" },
  { id: "batches", label: "Batches" },
  { id: "ingredients", label: "Ingredients" },
];

export default function ProductsEntryPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [open, setOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("variants");
  const [variantViewMode, setVariantViewMode] = useState<"grid" | "list">("grid");
  const [selectedFlavorId, setSelectedFlavorId] = useState<string | null>(null);
  
  // Batch logging state
  const [selectedVariantForBatch, setSelectedVariantForBatch] = useState<Variant | null>(null);
  const [batchFormOpen, setBatchFormOpen] = useState(false);
  const [batchForm, setBatchForm] = useState<{
    quantity: string;
    manufacturing_date: string;
    expiry_date: string;
    packaging_state: string;
    location: string;
    notes: string;
  }>(defaultBatchForm);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Variant Info Editing removed - now handled in /products/variants page

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    flavor_ids: [] as string[],
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: flavors } = useQuery({ queryKey: ["flavors"], queryFn: fetchFlavors });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["product-batches", selectedVariantForBatch?.id],
    queryFn: () => fetchBatches(selectedVariantForBatch!.id),
    enabled: !!selectedVariantForBatch?.id,
  });

  useEffect(() => {
    if (viewProduct && viewProduct.product_flavors?.length > 0 && !selectedFlavorId) {
      setSelectedFlavorId(viewProduct.product_flavors[0].flavor.id);
    }
  }, [viewProduct, selectedFlavorId]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleClose();
      addNotification({ type: "success", message: "Product created!" });
    },
    onError: (e: Error) => addNotification({ type: "error", message: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const res = await fetch("/api/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleClose();
      addNotification({ type: "success", message: "Product updated!" });
    },
    onError: (e: Error) => addNotification({ type: "error", message: e.message }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch("/api/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_active }) });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addNotification({ type: "success", message: "Status updated!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteOpen(false);
      addNotification({ type: "success", message: "Product deleted!" });
    },
    onError: (e: Error) => addNotification({ type: "error", message: e.message }),
  });

  const updateVariantMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/variants", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update variant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      addNotification({ type: "success", message: "Updated!" });
    },
    onError: (e: Error) => addNotification({ type: "error", message: e.message }),
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/product-batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to log batch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-batches"] });
      setBatchFormOpen(false);
      setBatchForm(defaultBatchForm);
      addNotification({ type: "success", message: "Batch logged!" });
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/product-batches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update batch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-batches"] });
      setBatchFormOpen(false);
      setEditingBatch(null);
      setBatchForm(defaultBatchForm);
      addNotification({ type: "success", message: "Batch updated!" });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product-batches?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-batches"] });
      addNotification({ type: "success", message: "Batch deleted!" });
    },
  });

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      is_active: product.is_active,
      flavor_ids: product.product_flavors.map(pf => pf.flavor.id),
    });
    setEditId(product.id);
    setEditMode(true);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.flavor_ids.length === 0) {
      addNotification({ type: "error", message: "Select at least one flavor" });
      return;
    }
    if (editMode && editId) {
      updateMutation.mutate({ ...formData, id: editId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantForBatch) return;
    const data = {
      ...batchForm,
      quantity: parseFloat(batchForm.quantity),
      variant_id: selectedVariantForBatch.id,
    };
    if (editingBatch) {
      updateBatchMutation.mutate({ ...data, id: editingBatch.id });
    } else {
      createBatchMutation.mutate(data);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setViewProduct(null);
    setEditMode(false);
    setEditId(null);
    setFormData({ name: "", description: "", is_active: true, flavor_ids: [] });
    setActiveTab("overview");
    setSelectedFlavorId(null);
    setSelectedVariantForBatch(null);
  };

  

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E8C547]" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1A1A1A" }}>Product Entry</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage your master product list and variants</p>
        </div>
        <button 
          onClick={() => { setEditMode(false); setOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
          style={{ backgroundColor: "#E8C547" }}
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="rounded-[2.5rem] overflow-hidden border bg-white shadow-sm" style={{ borderColor: "#F5F4EE" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FBFBF7" }}>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Product Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Flavors</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Active</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Inactive</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A83A" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#F5F4EE" }}>
            {products?.map((item: Product) => (
              <tr key={item.id} className="hover:bg-[#FBFBF7] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F5F4EE] group-hover:bg-[#E8C54720] transition-colors">
                      <ShoppingBag className="w-5 h-5" style={{ color: "#E8C547" }} />
                    </div>
                    <span className="font-bold text-[#1A1A1A]">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {item.product_flavors.map((pf, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F5F4EE] text-[#C9A83A]">{pf.flavor.name}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold" style={{ color: "#16A34A" }}>{item.variants_count?.active || 0}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold" style={{ color: "#DC2626" }}>{item.variants_count?.inactive || 0}</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleStatusMutation.mutate({ id: item.id, is_active: !item.is_active })}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${item.is_active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewProduct(item)} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#F5F4EE] text-[#C9A83A] hover:bg-[#E8C547] hover:text-white transition-all cursor-pointer">
                      View
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-2 rounded-xl hover:bg-[#F5F4EE] text-[#C9A83A] transition-colors cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }} className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <ShoppingBag className="w-16 h-16" />
                    <p className="font-bold text-xl">No products yet</p>
                    <p className="text-sm">Click "Add Product" to start your catalog</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Main Product Dialog (View/Edit/Add) */}
      {(open || !!viewProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>
                {viewProduct && !editMode ? "Product Details" : editMode ? "Edit Product" : "Add Product"}
              </h3>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
              {viewProduct && !editMode ? (
                <div className="space-y-6">
                  {/* View Logic */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{viewProduct.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm" style={{ color: "#C9A83A" }}>{viewProduct.variants?.length || 0} Variants</span>
                        <span style={{ color: "#C9A83A" }}>•</span>
                        <span className="text-sm" style={{ color: "#16A34A" }}>{viewProduct.variants_count?.active || 0} Active</span>
                        <span style={{ color: "#C9A83A" }}>•</span>
                        <span className="text-sm" style={{ color: "#DC2626" }}>{viewProduct.variants_count?.inactive || 0} Inactive</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditMode(true); handleEdit(viewProduct); }}
                        className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                        style={{ backgroundColor: "#E8C547" }}
                      >
                        Edit Product
                      </button>
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: viewProduct.is_active ? "#DCFCE7" : "#FEE2E2", color: viewProduct.is_active ? "#16A34A" : "#DC2626" }}>
                        {viewProduct.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F5F4EE" }}>
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                        style={{
                          backgroundColor: activeTab === tab.id ? "#FFFFFF" : "transparent",
                          color: activeTab === tab.id ? "#E8C547" : "#C9A83A",
                          boxShadow: activeTab === tab.id ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Components */}
                  <div className="min-h-[300px]">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {viewProduct.description && (
                          <div className="p-5 rounded-2xl border bg-[#FBFBF7]" style={{ borderColor: "#F5F4EE" }}>
                            <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: "#C9A83A" }}>Description</p>
                            <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{viewProduct.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#E8C54720", backgroundColor: "#FBFBF7" }}>
                            <p className="text-3xl font-bold" style={{ color: "#E8C547" }}>{viewProduct.product_flavors?.length || 0}</p>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#C9A83A" }}>Flavors</p>
                          </div>
                          <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#16A34A20", backgroundColor: "#F0FDF4" }}>
                            <p className="text-3xl font-bold" style={{ color: "#16A34A" }}>{viewProduct.variants_count?.active || 0}</p>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#16A34A" }}>Active</p>
                          </div>
                          <div className="p-5 rounded-2xl border text-center" style={{ borderColor: "#DC262620", backgroundColor: "#FEF2F2" }}>
                            <p className="text-3xl font-bold" style={{ color: "#DC2626" }}>{viewProduct.variants_count?.inactive || 0}</p>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#DC2626" }}>Inactive</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VARIANTS TAB */}
                    {activeTab === "variants" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold" style={{ color: "#C9A83A" }}>{viewProduct.product_flavors?.length} available flavors</p>
                          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F4EE]">
                            <button onClick={() => setVariantViewMode("grid")} className="p-2 rounded-lg cursor-pointer transition-all" style={{ backgroundColor: variantViewMode === "grid" ? "#FFFFFF" : "transparent", color: variantViewMode === "grid" ? "#E8C547" : "#C9A83A" }}>
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setVariantViewMode("list")} className="p-2 rounded-lg cursor-pointer transition-all" style={{ backgroundColor: variantViewMode === "list" ? "#FFFFFF" : "transparent", color: variantViewMode === "list" ? "#E8C547" : "#C9A83A" }}>
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {viewProduct.product_flavors?.map((pf: ProductFlavor) => {
                            const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === pf.flavor.id) || [];
                            const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
                            return (
                              <button key={pf.id} type="button" onClick={() => setSelectedFlavorId(pf.flavor.id)}
                                className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border"
                                style={{ 
                                  backgroundColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "white", 
                                  color: selectedFlavorId === pf.flavor.id ? "white" : "#1A1A1A", 
                                  borderColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "#E8E7E1" 
                                }}
                              >
                                {pf.flavor.name} <span className="ml-1 opacity-70">({activeCount})</span>
                              </button>
                            );
                          })}
                        </div>

                        {selectedFlavorId && (() => {
                          const pf = viewProduct.product_flavors.find((p: ProductFlavor) => p.flavor.id === selectedFlavorId);
                          const flavorVariants = viewProduct.variants?.filter((v: Variant) => v.flavor_id === selectedFlavorId) || [];
                          const activeCount = flavorVariants.filter((v: Variant) => v.is_active).length;
                          const inactiveCount = flavorVariants.length - activeCount;
                          return (
                            <div className="rounded-[1.5rem] border overflow-hidden bg-[#FBFBF7]" style={{ borderColor: "#F5F4EE" }}>
                              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#F5F4EE" }}>
                                <span className="font-bold text-sm text-[#1A1A1A]">{pf?.flavor.name} Variants</span>
                                <div className="flex gap-2">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>{activeCount} Active</span>
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{inactiveCount} Inactive</span>
                                </div>
                              </div>
                              <div className="p-4">
                                {flavorVariants.length > 0 ? (
                                  variantViewMode === "grid" ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {flavorVariants.map((variant: Variant) => (
                                         <div key={variant.id}
                                           className="p-4 rounded-2xl border text-center cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                                           style={{ 
                                             borderColor: variant.is_active ? "#16A34A20" : "#DC262620", 
                                             backgroundColor: variant.is_active ? "#FFFFFF" : "#FEF2F2" 
                                           }}
                                         >
                                           {variant.is_active && (
                                             <div className="absolute top-0 left-0 w-1 h-full bg-[#16A34A]" />
                                           )}
                                           <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: variant.grade === "500M" ? "#7C3AED" : "#2563EB" }}>{variant.grade}</p>
                                           <p className="text-base font-bold" style={{ color: "#1A1A1A" }}>{variant.size.size}{variant.size.unit}</p>
                                           <p className="text-[10px] text-gray-400 font-bold mb-3">{variant.size.pack_type}</p>
                                           
                                            <div className="flex flex-col items-center gap-1">
                                              {variant.price > 0 ? (
                                                <p className="text-sm font-bold" style={{ color: "#E8C547" }}>
                                                  {variant.price} SAR
                                                </p>
                                              ) : (
                                                <p className="text-sm" style={{ color: "#DC2626" }}>No Price</p>
                                              )}
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {flavorVariants.map((variant: Variant) => (
                                         <div key={variant.id} className="flex items-center justify-between p-3 rounded-2xl border bg-white hover:shadow-md transition-all" style={{ borderColor: "#F5F4EE" }}>
                                           <div className="flex items-center gap-4">
                                             <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider" style={{ backgroundColor: variant.grade === "500M" ? "#F3E8FF" : "#EFF6FF", color: variant.grade === "500M" ? "#7C3AED" : "#2563EB" }}>{variant.grade}</span>
                                             <div>
                                               <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{variant.size.size}{variant.size.unit}</p>
                                               <p className="text-[10px] font-bold text-[#C9A83A] uppercase tracking-wider">{variant.sku}</p>
                                             </div>
                                           </div>
                                            <div className="flex items-center gap-3">
                                              {variant.price > 0 ? (
                                                <p className="text-sm font-bold" style={{ color: "#E8C547" }}>
                                                  {variant.price} SAR
                                                </p>
                                              ) : (
                                                <p className="text-sm" style={{ color: "#DC2626" }}>No Price</p>
                                              )}
                                              {variant.is_active ? <CheckCircle className="w-5 h-5 text-[#16A34A]" /> : <span className="text-xs font-bold">SAR</span>}
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                  )
                                ) : (
                                  <div className="text-center py-10">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "#C9A83A" }} />
                                    <p className="text-sm font-bold text-red-400">No variants generated yet</p>
                                    <p className="text-xs mt-1 text-gray-400">Go to SKUs page to generate variants for this flavor</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* BATCHES TAB */}
                    {activeTab === "batches" && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#C9A83A" }}>Step 1: Select SKU to view batches</p>
                          <div className="flex flex-wrap gap-2 p-4 rounded-[1.5rem] bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
                            {(viewProduct.variants || []).map((v: Variant) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVariantForBatch(v)}
                                className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border"
                                style={{
                                  backgroundColor: selectedVariantForBatch?.id === v.id ? "#E8C547" : "white",
                                  color: selectedVariantForBatch?.id === v.id ? "white" : "#1A1A1A",
                                  borderColor: selectedVariantForBatch?.id === v.id ? "#E8C547" : "#E8E7E1",
                                }}
                              >
                                {v.sku}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedVariantForBatch && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h4 className="text-base font-bold text-[#1A1A1A]">{selectedVariantForBatch.sku}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-[#F5F4EE] text-[#C9A83A] uppercase tracking-wider">{selectedVariantForBatch.flavor.name} • {selectedVariantForBatch.size.size}{selectedVariantForBatch.size.unit}</span>
                              </div>
                              <button 
                                onClick={() => setBatchFormOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                                style={{ backgroundColor: "#F97316" }}
                              >
                                <Plus className="w-3.5 h-3.5" /> Log New Batch
                              </button>
                            </div>

                            {batchesLoading ? (
                              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#E8C547]" /></div>
                            ) : batches && batches.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {batches.map((batch: Batch) => (
                                  <div key={batch.id} className="p-4 rounded-[1.5rem] border bg-[#FBFBF7] group hover:border-[#E8C54740] transition-all" style={{ borderColor: "#F5F4EE" }}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center font-bold text-lg text-[#1A1A1A]" style={{ borderColor: "#F5F4EE" }}>
                                          {batch.quantity}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-[#C9A83A] uppercase tracking-widest">{batch.batch_id}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm font-bold text-[#1A1A1A]">{batch.location}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-white border rounded-lg">{batch.packaging_state}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingBatch(batch); setBatchForm({ quantity: batch.quantity.toString(), manufacturing_date: batch.manufacturing_date ? batch.manufacturing_date.split('T')[0] : "", expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : "", packaging_state: batch.packaging_state, location: batch.location, notes: batch.notes || "" }); setBatchFormOpen(true); }} className="p-2 rounded-xl hover:bg-[#E8C54720] transition-colors cursor-pointer"><Edit className="w-4 h-4 text-[#E8C547]" /></button>
                                        <button onClick={() => deleteBatchMutation.mutate(batch.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                      </div>
                                    </div>
                                    {(batch.manufacturing_date || batch.expiry_date) && (
                                      <div className="flex gap-4 mt-3 pt-3 border-t border-white">
                                        {batch.manufacturing_date && (
                                          <div>
                                            <p className="text-[9px] font-bold text-[#C9A83A] uppercase tracking-widest">Mfg Date</p>
                                            <p className="text-xs font-bold text-[#1A1A1A]">{format(new Date(batch.manufacturing_date), 'dd MMM yyyy')}</p>
                                          </div>
                                        )}
                                        {batch.expiry_date && (
                                          <div>
                                            <p className="text-[9px] font-bold text-[#C9A83A] uppercase tracking-widest">Expiry Date</p>
                                            <p className="text-xs font-bold text-[#1A1A1A]">{format(new Date(batch.expiry_date), 'dd MMM yyyy')}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-10 rounded-[1.5rem] bg-[#FBFBF7] border border-dashed border-[#E8E7E1]">
                                <Layers className="w-10 h-10 mx-auto mb-2 opacity-10" />
                                <p className="text-sm font-bold text-gray-400">No batches logged for this SKU</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* INGREDIENTS TAB */}
                    {activeTab === "ingredients" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {viewProduct.product_flavors?.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {viewProduct.product_flavors.map((pf: ProductFlavor) => (
                                <button key={pf.id} type="button" onClick={() => setSelectedFlavorId(pf.flavor.id)}
                                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border"
                                  style={{ 
                                    backgroundColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "white", 
                                    color: selectedFlavorId === pf.flavor.id ? "white" : "#1A1A1A", 
                                    borderColor: selectedFlavorId === pf.flavor.id ? "#E8C547" : "#E8E7E1" 
                                  }}
                                >
                                  {pf.flavor.name}
                                </button>
                              ))}
                            </div>
                            {selectedFlavorId && (() => {
                              const pf = viewProduct.product_flavors.find((p: ProductFlavor) => p.flavor.id === selectedFlavorId);
                              return pf ? (
                                <div className="p-6 rounded-[1.5rem] border bg-[#FBFBF7] relative overflow-hidden" style={{ borderColor: "#F5F4EE" }}>
                                  <div className="absolute top-0 right-0 p-3 opacity-10"><ShoppingBag className="w-12 h-12" /></div>
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className="font-bold text-lg text-[#1A1A1A]">{pf.flavor.name}</span>
                                    <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold bg-[#E8C54720] text-[#E8C547] uppercase tracking-wider">{pf.flavor.short_code}</span>
                                  </div>
                                  {pf.flavor.ingredients ? (
                                    <div className="flex flex-wrap gap-2">
                                      {pf.flavor.ingredients.split(",").map((ing: string, idx: number) => (
                                        <span key={idx} className="px-4 py-2 rounded-xl text-xs font-bold border bg-white text-[#4B5563]" style={{ borderColor: "#F5F4EE" }}>{ing.trim()}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm font-bold text-gray-400 italic">No specific ingredients listed for this flavor.</p>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </>
                        ) : (
                          <div className="text-center py-10 rounded-[1.5rem] bg-[#FBFBF7] border border-dashed border-[#E8E7E1]">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-10" />
                            <p className="text-sm font-bold text-gray-400">No flavors assigned to this product.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: "#F5F4EE" }}>
                    <button onClick={handleClose} className="px-8 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Close</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Product Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Fruit Powder" required className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-[#E8C54720] outline-none transition-all" style={{ borderColor: "#E8E7E1" }} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Flavors *</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-auto p-1 scrollbar-hide">
                        {(flavors || []).map((f: Flavor) => (
                          <button key={f.id} type="button"
                            onClick={() => setFormData(prev => ({ ...prev, flavor_ids: prev.flavor_ids.includes(f.id) ? prev.flavor_ids.filter(id => id !== f.id) : [...prev.flavor_ids, f.id] }))}
                            className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all cursor-pointer border relative"
                            style={{ 
                              backgroundColor: formData.flavor_ids.includes(f.id) ? "#E8C54720" : "white", 
                              color: formData.flavor_ids.includes(f.id) ? "#E8C547" : "#1A1A1A", 
                              borderColor: formData.flavor_ids.includes(f.id) ? "#E8C547" : "#E8E7E1" 
                            }}
                          >
                            <span className="truncate block pr-4">{f.name}</span>
                            {formData.flavor_ids.includes(f.id) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                            )}
                          </button>
                        ))}
                      </div>
                      {formData.flavor_ids.length === 0 && <p className="text-[10px] font-bold uppercase tracking-wider ml-1 text-red-500">Select at least one flavor</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Description</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-[#E8C54720] outline-none transition-all" style={{ borderColor: "#E8E7E1" }} placeholder="Optional product description..." />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-[#1A1A1A]">Product Status</label>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg" style={{ backgroundColor: formData.is_active ? "#DCFCE7" : "#FEE2E2", color: formData.is_active ? "#16A34A" : "#DC2626" }}>{formData.is_active ? "Active" : "Inactive"}</span>
                      </div>
                      <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shadow-inner"
                        style={{ backgroundColor: formData.is_active ? "#E8C547" : "#E5E7EB" }}
                      >
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm" style={{ transform: formData.is_active ? "translateX(24px)" : "translateX(4px)" }} />
                      </button>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button type="button" onClick={handleClose} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                      <button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="px-10 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: "#E8C547" }}
                      >
                        {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editMode ? "Save Product" : "Create Product"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Form Modal */}
      {batchFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{editingBatch ? "Edit Batch" : "Log New Batch"}</h3>
              <button onClick={() => { setBatchFormOpen(false); setEditingBatch(null); setBatchForm(defaultBatchForm); }} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedVariantForBatch && (
                <div className="p-3 rounded-xl bg-[#FBFBF7] border flex items-center justify-between" style={{ borderColor: "#F5F4EE" }}>
                  <span className="text-xs font-mono font-bold text-[#C9A83A]">{selectedVariantForBatch.sku}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedVariantForBatch.size.size}{selectedVariantForBatch.size.unit}</span>
                </div>
              )}

              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Quantity *</label>
                    <input type="number" min="1" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Packaging State</label>
                    <select value={batchForm.packaging_state} onChange={(e) => setBatchForm({ ...batchForm, packaging_state: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold bg-white focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }}>
                      {PACKAGING_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Mfg Date</label>
                    <input type="date" value={batchForm.manufacturing_date} onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Expiry Date</label>
                    <input type="date" value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Location</label>
                    <select value={batchForm.location} onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold bg-white focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }}>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold ml-1 text-[#1A1A1A]">Notes</label>
                  <textarea value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-[#E8C54720] outline-none" style={{ borderColor: "#E8E7E1" }} placeholder="Optional batch notes..." />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setBatchFormOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={createBatchMutation.isPending || updateBatchMutation.isPending}
                    className="px-8 py-2.5 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: "#E8C547" }}
                  >
                    {(createBatchMutation.isPending || updateBatchMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingBatch ? "Update Batch" : "Log Batch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Delete Product</h3>
            <p className="text-gray-500 mt-2">Are you sure you want to delete this product? This will remove all associated flavor assignments and variants.</p>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold border transition-all text-gray-600 hover:bg-gray-50 cursor-pointer"
                style={{ borderColor: "#E8E7E1" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#DC2626" }}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
