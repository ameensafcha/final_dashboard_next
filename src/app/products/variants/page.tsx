"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight, AlertCircle, LayoutGrid, List, CheckCircle, DollarSign, X, Loader2,} from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { generateSKU, GRADES } from "@/lib/sku";

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

async function fetchAvailableVariants(productId: string, grade: string) {
  const res = await fetch(`/api/variants/available?product_id=${productId}&grade=${grade}`);
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
  variants?: Variant[];
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
  name_arabic: string | null;
  barcode: string | null;
  sfda_reg_no: string | null;
  shelf_life_months: number | null;
  storage_instructions: string | null;
  nutritional_values: string | null;
  product: Product;
  flavor: Flavor;
  size: Size;
}

const defaultForm = {
  product_id: "",
  flavor_id: "",
  size_id: "",
  grade: "STD",
  price: "",
  description: "",
  sku: "",
  is_active: true,
  name_arabic: "",
  barcode: "",
  sfda_reg_no: "",
  shelf_life_months: null as number | null,
  storage_instructions: "",
  nutritional_values: "",
};

const defaultGenerate = {
  product_id: "",
  grade: "STD",
  flavor_ids: [] as string[],
  size_ids: [] as string[],
};

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

  const [formData, setFormData] = useState(defaultForm);
  const [generateData, setGenerateData] = useState(defaultGenerate);

  const { data: variantsData, isLoading } = useQuery({
    queryKey: ["variants", page],
    queryFn: () => fetchVariants(page, 50),
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: flavors } = useQuery({ queryKey: ["flavors"], queryFn: fetchFlavors });
  const { data: sizes } = useQuery({ queryKey: ["sizes"], queryFn: fetchSizes });

  const { data: availableData } = useQuery({
    queryKey: ["availableVariants", generateData.product_id, generateData.grade],
    queryFn: () => fetchAvailableVariants(generateData.product_id, generateData.grade),
    enabled: !!generateData.product_id && generateOpen,
  });

  // Auto-generate SKU when grade/flavor/size change
  const updateSKU = (updates: Partial<typeof formData>) => {
    const merged = { ...formData, ...updates };
    if (merged.grade && merged.flavor_id && merged.size_id && !editMode) {
      const flavor = (flavors || []).find((f: Flavor) => f.id === merged.flavor_id);
      const size = (sizes || []).find((s: Size) => s.id === merged.size_id);
      if (flavor && size) {
        merged.sku = generateSKU(merged.grade, flavor.short_code, size.size);
      }
    }
    setFormData(merged);
  };

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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      resetForm();
      addNotification({ type: "success", message: "SKU created successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to create" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: typeof generateData) => {
      const selectedFlavors = (flavors || []).filter((f: Flavor) => data.flavor_ids.includes(f.id));
      const selectedSizes = (sizes || []).filter((s: Size) => data.size_ids.includes(s.id));
      const product = (products || []).find((p: Product) => p.id === data.product_id);
      if (!product) throw new Error("Product not found");

      const variants = selectedFlavors.flatMap((flavor: Flavor) =>
        selectedSizes.map((size: Size) => ({
          product_id: data.product_id,
          flavor_id: flavor.id,
          size_id: size.id,
          grade: data.grade,
          sku: generateSKU(data.grade, flavor.short_code, size.size),
          price: 0,
          is_active: false,
        }))
      );

      const res = await fetch("/api/variants/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["availableVariants"] });
      setGenerateOpen(false);
      setGenerateData(defaultGenerate);
      addNotification({ type: "success", message: data.message || `${data.count} variants generated!` });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to generate" });
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      addNotification({ type: "success", message: "Variant updated!" });
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Variant deleted!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const resetForm = () => { setFormData(defaultForm); setEditMode(false); setEditId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flavor_id || !formData.size_id || !formData.sku) {
      addNotification({ type: "error", message: "Please fill all required fields" });
      return;
    }
    if (editMode && editId) {
      updateMutation.mutate({ ...formData, id: editId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateData.product_id || generateData.flavor_ids.length === 0 || generateData.size_ids.length === 0) {
      addNotification({ type: "error", message: "Select product, flavors and sizes" });
      return;
    }
    generateMutation.mutate(generateData);
  };

  const handleEdit = (variant: Variant) => {
    setFormData({
      product_id: variant.product_id,
      flavor_id: variant.flavor_id,
      size_id: variant.size_id,
      grade: variant.grade,
      price: String(variant.price),
      description: variant.description || "",
      sku: variant.sku,
      is_active: variant.is_active,
      name_arabic: variant.name_arabic || "",
      barcode: variant.barcode || "",
      sfda_reg_no: variant.sfda_reg_no || "",
      shelf_life_months: variant.shelf_life_months || null,
      storage_instructions: variant.storage_instructions || "",
      nutritional_values: variant.nutritional_values || "",
    });
    setEditMode(true);
    setEditId(variant.id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewVariant(null);
    setEditMode(false);
    setEditId(null);
    resetForm();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (variantsData?.pagination.totalPages || 1)) {
      setPage(newPage);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const variantsList: Variant[] = variantsData?.data || [];
  const pagination = variantsData?.pagination;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>SKUs / Variants</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage product SKUs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setGenerateData(defaultGenerate); setGenerateOpen(true); }}
            className="flex hidden items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#E8C547", color: "white" }}
          >
            <Package className="w-4 h-4" />
            Generate SKUs
          </button>
          <button
            onClick={() => { resetForm(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#F97316", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Add SKU
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>SKU / Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Grade</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Size</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variantsList.map((item, index) => (
              <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}>
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{item.product.name}</p>
                  <p className="text-xs font-mono" style={{ color: "#C9A83A" }}>{item.sku}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: item.grade === "500M" ? "#F3E8FF" : "#EFF6FF",
                      color: item.grade === "500M" ? "#7C3AED" : "#2563EB",
                    }}
                  >
                    {item.grade}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "#E8C547", color: "white" }}>
                    {item.flavor.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{item.size.size}{item.size.unit}</p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>{item.size.pack_type}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: item.price > 0 ? "#E8C547" : "#DC2626" }}>
                  {item.price > 0 ? `${item.price} SAR` : "-"}
                </td>
                <td className="px-4 py-3">
                  {item.is_active ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewVariant(item)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-yellow-100 cursor-pointer" style={{ color: "#E8C547", backgroundColor: "#F5F4EE" }}>
                      View
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-yellow-100 cursor-pointer" style={{ color: "#E8C547" }}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-100 cursor-pointer" style={{ color: "#DC2626" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {variantsList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No SKUs found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Generate or add SKUs manually</p>
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
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 cursor-pointer" style={{ color: "#E8C547" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm" style={{ color: "#1A1A1A" }}>Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 cursor-pointer" style={{ color: "#E8C547" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate SKUs Modal */}
      {generateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Generate SKUs</h3>
              <button onClick={() => { setGenerateOpen(false); setGenerateData(defaultGenerate); }} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Product *</label>
                  <select
                    value={generateData.product_id}
                    onChange={(e) => setGenerateData({ ...generateData, product_id: e.target.value, flavor_ids: [], size_ids: [] })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm"
                    style={{ borderColor: "#E8E7E1" }}
                  >
                    <option value="">Select Product</option>
                    {(products || []).map((p: Product) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Grade *</label>
                  <div className="flex gap-2 p-1 bg-[#F5F4EE] rounded-xl">
                    {GRADES.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGenerateData({ ...generateData, grade: g.value, flavor_ids: [], size_ids: [] })}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                        style={{
                          backgroundColor: generateData.grade === g.value ? (g.value === "500M" ? "#7C3AED" : "#2563EB") : "transparent",
                          color: generateData.grade === g.value ? "white" : "#666",
                          boxShadow: generateData.grade === g.value ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {generateData.product_id && availableData && (
                  <>
                    <div className="p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: "#FBFBF7", border: "1px solid #F5F4EE" }}>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold" style={{ color: "#C9A83A" }}>Available for {generateData.grade}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: "#1A1A1A" }}>Can generate: <span style={{ color: "#16A34A" }}>{availableData.stats.can_generate} new</span></p>
                      </div>
                      <div className="text-right text-xs font-bold" style={{ color: "#666" }}>
                        {availableData.stats.already_generated} existing
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Select Flavors *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableData.flavors.map((flavor: { id: string; name: string; short_code: string; is_generated: boolean }) => (
                          <button
                            key={flavor.id}
                            type="button"
                            onClick={() => !flavor.is_generated && setGenerateData(prev => ({
                              ...prev,
                              flavor_ids: prev.flavor_ids.includes(flavor.id)
                                ? prev.flavor_ids.filter(id => id !== flavor.id)
                                : [...prev.flavor_ids, flavor.id]
                            }))}
                            disabled={flavor.is_generated}
                            className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all relative border"
                            style={{
                              backgroundColor: generateData.flavor_ids.includes(flavor.id) ? "#E8C54720" : flavor.is_generated ? "#F5F5F5" : "white",
                              borderColor: generateData.flavor_ids.includes(flavor.id) ? "#E8C547" : "#E8E7E1",
                              color: generateData.flavor_ids.includes(flavor.id) ? "#E8C547" : flavor.is_generated ? "#9CA3AF" : "#1A1A1A",
                              opacity: flavor.is_generated ? 0.6 : 1,
                              cursor: flavor.is_generated ? "not-allowed" : "pointer",
                            }}
                          >
                            <span className="truncate pr-4 block">{flavor.name}</span>
                            {flavor.is_generated && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
                            {!flavor.is_generated && generateData.flavor_ids.includes(flavor.id) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Select Sizes *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableData.sizes.map((size: { id: string; size: string; unit: string; pack_type: string; is_generated: boolean }) => (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => !size.is_generated && setGenerateData(prev => ({
                              ...prev,
                              size_ids: prev.size_ids.includes(size.id)
                                ? prev.size_ids.filter(id => id !== size.id)
                                : [...prev.size_ids, size.id]
                            }))}
                            disabled={size.is_generated}
                            className="px-4 py-3 rounded-xl text-sm font-bold text-left transition-all relative border"
                            style={{
                              backgroundColor: generateData.size_ids.includes(size.id) ? "#E8C54720" : size.is_generated ? "#F5F5F5" : "white",
                              borderColor: generateData.size_ids.includes(size.id) ? "#E8C547" : "#E8E7E1",
                              color: generateData.size_ids.includes(size.id) ? "#E8C547" : size.is_generated ? "#9CA3AF" : "#1A1A1A",
                              opacity: size.is_generated ? 0.6 : 1,
                              cursor: size.is_generated ? "not-allowed" : "pointer",
                            }}
                          >
                            <span className="truncate pr-4 block">{size.size}{size.unit}</span>
                            <span className="block text-[10px] uppercase opacity-60">{size.pack_type}</span>
                            {size.is_generated && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
                            {!size.is_generated && generateData.size_ids.includes(size.id) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E8C547]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {generateData.flavor_ids.length > 0 && generateData.size_ids.length > 0 && (
                      <div className="p-4 rounded-2xl space-y-2 border" style={{ backgroundColor: "#FBFBF7", borderColor: "#F5F4EE" }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A83A" }}>Preview ({generateData.flavor_ids.length * generateData.size_ids.length} SKUs):</p>
                        <div className="max-h-32 overflow-auto font-mono text-[11px] space-y-1 scrollbar-hide">
                          {availableData.flavors
                            .filter((f: { id: string; short_code: string }) => generateData.flavor_ids.includes(f.id))
                            .flatMap((f: { id: string; short_code: string }) =>
                              availableData.sizes
                                .filter((s: { id: string; size: string }) => generateData.size_ids.includes(s.id))
                                .map((s: { id: string; size: string }) => (
                                  <p key={`${f.id}-${s.id}`} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                                    SAF-{generateData.grade}-{f.short_code}-{s.size}
                                  </p>
                                ))
                            )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => { setGenerateOpen(false); setGenerateData(defaultGenerate); }} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending || generateData.flavor_ids.length === 0 || generateData.size_ids.length === 0}
                    className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: "#E8C547" }}
                  >
                    {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {generateMutation.isPending ? "Generating..." : `Generate ${generateData.flavor_ids.length * generateData.size_ids.length} SKUs`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit/Add Modal */}
      {(open || !!viewVariant) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>
                {viewVariant && !editMode ? "SKU Details" : editMode ? "Edit SKU" : "Add SKU"}
              </h3>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
              {viewVariant && !editMode ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 rounded-[1.5rem]" style={{ backgroundColor: "#FBFBF7" }}>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>{viewVariant.product.name}</h3>
                      <p className="text-sm font-mono mt-1" style={{ color: "#C9A83A" }}>{viewVariant.sku}</p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: viewVariant.grade === "500M" ? "#F3E8FF" : "#EFF6FF",
                        color: viewVariant.grade === "500M" ? "#7C3AED" : "#2563EB",
                      }}
                    >
                      {viewVariant.grade}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Flavor</p>
                      <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{viewVariant.flavor.name}</p>
                    </div>
                    <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Size</p>
                      <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{viewVariant.size.size}{viewVariant.size.unit}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{viewVariant.size.pack_type}</p>
                    </div>
                    <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Price</p>
                      <p className="text-2xl font-bold" style={{ color: viewVariant.price > 0 ? "#E8C547" : "#DC2626" }}>
                        {viewVariant.price > 0 ? `${viewVariant.price} SAR` : "Price Not Set"}
                      </p>
                    </div>
                  </div>

                  {viewVariant.description && (
                    <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Description</p>
                      <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewVariant.description}</p>
                    </div>
                  )}

                  {viewVariant.name_arabic && (
                    <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Arabic Name</p>
                      <p className="text-sm" style={{ color: "#1A1A1A" }} dir="rtl">{viewVariant.name_arabic}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {viewVariant.barcode && (
                      <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                        <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Barcode</p>
                        <p className="text-sm font-mono" style={{ color: "#1A1A1A" }}>{viewVariant.barcode}</p>
                      </div>
                    )}
                    {viewVariant.sfda_reg_no && (
                      <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                        <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>SFDA Reg No</p>
                        <p className="text-sm font-mono" style={{ color: "#1A1A1A" }}>{viewVariant.sfda_reg_no}</p>
                      </div>
                    )}
                  </div>

                  {viewVariant.shelf_life_months && (
                    <div className="p-4 rounded-2xl border" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Shelf Life</p>
                      <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewVariant.shelf_life_months} months</p>
                    </div>
                  )}

                  {viewVariant.storage_instructions && (
                    <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Storage Instructions</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{viewVariant.storage_instructions}</p>
                    </div>
                  )}

                  {viewVariant.nutritional_values && (
                    <div className="p-4 rounded-2xl border col-span-2" style={{ borderColor: "#F5F4EE" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "#C9A83A" }}>Nutritional Values</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{viewVariant.nutritional_values}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={handleClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Close</button>
                    <button onClick={() => { setEditMode(true); handleEdit(viewVariant); }} 
                      className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                      style={{ backgroundColor: "#E8C547" }}
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!editMode && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Product *</label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => updateSKU({ product_id: e.target.value, flavor_id: "", size_id: "", sku: "" })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm"
                        style={{ borderColor: "#E8E7E1" }}
                      >
                        <option value="">Select Product</option>
                        {(products || []).map((p: Product) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!editMode && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Grade *</label>
                      <div className="flex gap-2 p-1 bg-[#F5F4EE] rounded-xl">
                        {GRADES.map((g) => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => updateSKU({ grade: g.value })}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                            style={{
                              backgroundColor: formData.grade === g.value ? (g.value === "500M" ? "#7C3AED" : "#2563EB") : "transparent",
                              color: formData.grade === g.value ? "white" : "#666",
                              boxShadow: formData.grade === g.value ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                            }}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {!editMode && (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Flavor *</label>
                        <select
                          value={formData.flavor_id}
                          onChange={(e) => updateSKU({ flavor_id: e.target.value, size_id: "", sku: "" })}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm disabled:bg-[#F5F4EE] disabled:cursor-not-allowed"
                          style={{ borderColor: "#E8E7E1" }}
                          disabled={!formData.product_id}
                        >
                          <option value="">{formData.product_id ? "Select Flavor" : "Select Product First"}</option>
                          {(() => {
                            const selectedProduct = (products || []).find((p: Product) => p.id === formData.product_id);
                            if (!selectedProduct) return null;
                            const allowedFlavorIds = selectedProduct.product_flavors.map((pf: any) => pf.flavor.id);
                            return (flavors || [])
                              .filter((f: Flavor) => allowedFlavorIds.includes(f.id))
                              .map((f: Flavor) => (
                                <option key={f.id} value={f.id}>{f.name} ({f.short_code})</option>
                              ));
                          })()}
                        </select>
                      </div>
                    )}

                    {!editMode && (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Size *</label>
                        <select
                          value={formData.size_id}
                          onChange={(e) => updateSKU({ size_id: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm disabled:bg-[#F5F4EE] disabled:cursor-not-allowed"
                          style={{ borderColor: "#E8E7E1" }}
                          disabled={!formData.flavor_id}
                        >
                          <option value="">{formData.flavor_id ? "Select Size" : "Select Flavor First"}</option>
                          {(() => {
                            const selectedProduct = (products || []).find((p: Product) => p.id === formData.product_id);
                            if (!selectedProduct) return null;
                            
                            // Filter sizes: only those NOT already created for this grade + flavor
                            const existingSizeIds = selectedProduct.variants
                              ?.filter((v: Variant) => v.flavor_id === formData.flavor_id && v.grade === formData.grade)
                              .map((v: Variant) => v.size_id) || [];

                            return (sizes || [])
                              .filter((s: Size) => s.is_active && !existingSizeIds.includes(s.id))
                              .map((s: Size) => (
                                <option key={s.id} value={s.id}>{s.size}{s.unit} ({s.pack_type})</option>
                              ));
                          })()}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>SKU Code</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Auto-generated or enter manually"
                      readOnly={editMode}
                      className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all ${editMode ? "bg-[#F5F4EE] cursor-not-allowed text-gray-500" : "bg-white"}`}
                      style={{ borderColor: "#E8E7E1" }}
                    />
                    {!editMode && <p className="text-[10px] uppercase tracking-wider font-bold ml-1" style={{ color: "#C9A83A" }}>Auto-fills when Grade + Flavor + Size selected</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Price (SAR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00 (optional)"
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white text-sm font-semibold"
                      style={{ borderColor: "#E8E7E1" }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBFBF7] border" style={{ borderColor: "#F5F4EE" }}>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-[#1A1A1A]">SKU Status</label>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg" style={{ backgroundColor: formData.is_active ? "#DCFCE7" : "#FEE2E2", color: formData.is_active ? "#16A34A" : "#DC2626" }}>{formData.is_active ? "Active" : "Inactive"}</span>
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shadow-inner"
                      style={{ backgroundColor: formData.is_active ? "#E8C547" : "#E5E7EB" }}
                    >
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm" style={{ transform: formData.is_active ? "translateX(24px)" : "translateX(4px)" }} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                      style={{ borderColor: "#E8E7E1" }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Arabic Name</label>
                    <input
                      type="text"
                      value={formData.name_arabic || ""}
                      onChange={(e) => setFormData({ ...formData, name_arabic: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                      style={{ borderColor: "#E8E7E1" }}
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Barcode</label>
                      <input
                        type="text"
                        value={formData.barcode || ""}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                        style={{ borderColor: "#E8E7E1" }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>SFDA Reg No</label>
                      <input
                        type="text"
                        value={formData.sfda_reg_no || ""}
                        onChange={(e) => setFormData({ ...formData, sfda_reg_no: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                        style={{ borderColor: "#E8E7E1" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Shelf Life (Months)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.shelf_life_months || ""}
                      onChange={(e) => setFormData({ ...formData, shelf_life_months: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                      style={{ borderColor: "#E8E7E1" }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Storage Instructions</label>
                    <textarea
                      value={formData.storage_instructions || ""}
                      onChange={(e) => setFormData({ ...formData, storage_instructions: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                      style={{ borderColor: "#E8E7E1" }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold ml-1" style={{ color: "#1A1A1A" }}>Nutritional Values</label>
                    <textarea
                      value={formData.nutritional_values || ""}
                      onChange={(e) => setFormData({ ...formData, nutritional_values: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C54720] transition-all bg-white"
                      style={{ borderColor: "#E8E7E1" }}
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={handleClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-8 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: "#E8C547" }}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editMode ? "Save Changes" : "Create SKU"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200" style={{ backgroundColor: "#FBFBF7" }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Delete SKU</h3>
                <p className="text-gray-500 mt-2">Are you sure you want to delete this SKU? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border transition-all text-gray-600 hover:bg-gray-50 cursor-pointer"
                style={{ borderColor: "#E8E7E1" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#DC2626" }}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
