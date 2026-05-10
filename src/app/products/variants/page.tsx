"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, X } from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { generateSKU } from "@/lib/sku";
import { type Variant, type VariantFormData, type GenerateFormData, type PaginationInfo, type Product, type Flavor, type Size } from "./_components/types";
import { VariantsTable } from "./_components/variants-table";
import { VariantViewContent } from "./_components/variant-view-content";
import { VariantFormContent } from "./_components/variant-form-content";
import { GenerateSkusDialog } from "./_components/generate-skus-dialog";
import { DeleteVariantDialog } from "./_components/delete-variant-dialog";

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

const defaultForm: VariantFormData = {
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
  shelf_life_months: null,
  storage_instructions: "",
  nutritional_values: "",
};

const defaultGenerate: GenerateFormData = {
  product_id: "",
  grade: "STD",
  flavor_ids: [],
  size_ids: [],
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

  const updateSKU = (updates: Partial<VariantFormData>) => {
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
    mutationFn: async (data: VariantFormData) => {
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
    mutationFn: async (data: GenerateFormData) => {
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

  const dialogTitle = viewVariant && !editMode ? "SKU Details" : editMode ? "Edit SKU" : "Add SKU";
  const dialogOpen = open || !!viewVariant;

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

      <VariantsTable
        variants={variantsList}
        pagination={pagination}
        onView={(v) => setViewVariant(v)}
        onEdit={handleEdit}
        onDelete={(v) => { setDeleteId(v.id); setDeleteOpen(true); }}
        onPageChange={handlePageChange}
      />

      <GenerateSkusDialog
        open={generateOpen}
        generateData={generateData}
        products={products || []}
        availableData={availableData}
        isPending={generateMutation.isPending}
        onClose={() => { setGenerateOpen(false); setGenerateData(defaultGenerate); }}
        onChange={setGenerateData}
        onSubmit={handleGenerate}
      />

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#F5F4EE" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{dialogTitle}</h3>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
              {viewVariant && !editMode ? (
                <VariantViewContent
                  variant={viewVariant}
                  onEdit={() => handleEdit(viewVariant)}
                  onClose={handleClose}
                />
              ) : (
                <VariantFormContent
                  formData={formData}
                  products={products}
                  flavors={flavors}
                  sizes={sizes}
                  editMode={editMode}
                  isPending={createMutation.isPending || updateMutation.isPending}
                  onFieldChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                  onUpdateSKU={updateSKU}
                  onSubmit={handleSubmit}
                  onCancel={handleClose}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <DeleteVariantDialog
        open={deleteOpen}
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
