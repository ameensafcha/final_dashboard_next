"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { type Product, type Variant, type Batch } from "./_components/types";
import { ProductsTable } from "./_components/products-table";
import { ProductDialog } from "./_components/product-dialog";
import { ProductViewContent } from "./_components/product-view-content";
import { ProductFormContent } from "./_components/product-form-content";
import { BatchFormDialog } from "./_components/batch-form-dialog";

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

const defaultBatchForm = {
  quantity: "",
  manufacturing_date: "",
  expiry_date: "",
  packaging_state: "Bulk Packed",
  location: "Warehouse A",
  notes: "",
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [open, setOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("variants");
  const [variantViewMode, setVariantViewMode] = useState<"grid" | "list">("grid");
  const [selectedFlavorId, setSelectedFlavorId] = useState<string | null>(null);

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

  const createBatchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
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
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/product-batches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
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
      const res = await fetch(`/api/product-batches/${id}`, { method: "DELETE" });
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
      updateBatchMutation.mutate({ id: editingBatch.id, ...data });
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

  const dialogTitle = viewProduct && !editMode
    ? "Product Details"
    : editMode
      ? "Edit Product"
      : "Add Product";

  const dialogOpen = open || !!viewProduct;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E8C547]" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1A1A1A" }}>Products</h1>
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

      <div className="overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-md)" }}>
        <ProductsTable
          products={products || []}
          onView={(p) => setViewProduct(p)}
          onEdit={handleEdit}
          onDelete={(p) => { setDeleteId(p.id); setDeleteOpen(true); }}
          onToggleStatus={(p) => toggleStatusMutation.mutate({ id: p.id, is_active: !p.is_active })}
        />
      </div>

      <ProductDialog open={dialogOpen} title={dialogTitle} onClose={handleClose}>
        {viewProduct && !editMode ? (
          <ProductViewContent
            viewProduct={viewProduct}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedFlavorId={selectedFlavorId}
            onFlavorSelect={setSelectedFlavorId}
            variantViewMode={variantViewMode}
            onVariantViewModeChange={setVariantViewMode}
            selectedVariantForBatch={selectedVariantForBatch}
            onVariantForBatchSelect={setSelectedVariantForBatch}
            batches={batches}
            batchesLoading={batchesLoading}
            onEditProduct={() => handleEdit(viewProduct)}
            onLogBatch={() => setBatchFormOpen(true)}
            onEditBatch={(batch) => {
              setEditingBatch(batch);
              setBatchForm({
                quantity: batch.quantity.toString(),
                manufacturing_date: batch.manufacturing_date ? batch.manufacturing_date.split('T')[0] : "",
                expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : "",
                packaging_state: batch.packaging_state,
                location: batch.location,
                notes: batch.notes || "",
              });
              setBatchFormOpen(true);
            }}
            onDeleteBatch={(batchId) => deleteBatchMutation.mutate(batchId)}
            onClose={handleClose}
          />
        ) : (
          <ProductFormContent
            formData={formData}
            flavors={flavors}
            editMode={editMode}
            isPending={createMutation.isPending || updateMutation.isPending}
            onFieldChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            onFlavorToggle={(flavorId) => setFormData(prev => ({
              ...prev,
              flavor_ids: prev.flavor_ids.includes(flavorId)
                ? prev.flavor_ids.filter(id => id !== flavorId)
                : [...prev.flavor_ids, flavorId],
            }))}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </ProductDialog>

      <BatchFormDialog
        open={batchFormOpen}
        selectedVariantForBatch={selectedVariantForBatch}
        batchForm={batchForm}
        editingBatch={editingBatch}
        isPending={createBatchMutation.isPending || updateBatchMutation.isPending}
        onClose={() => { setBatchFormOpen(false); setEditingBatch(null); setBatchForm(defaultBatchForm); }}
        onSubmit={handleBatchSubmit}
        onFieldChange={(field, value) => setBatchForm(prev => ({ ...prev, [field]: value }))}
      />

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200" style={{ backgroundColor: "#FBFBF7" }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-2xl">⚠</span>
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Delete Product</h3>
                <p className="text-gray-500 mt-2">Are you sure you want to delete this product? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold border transition-all text-gray-600 hover:bg-gray-50 cursor-pointer" style={{ borderColor: "#E8E7E1" }}>
                Cancel
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#DC2626" }}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
