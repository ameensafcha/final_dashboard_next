"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { SizesTable } from "./_components/sizes-table";
import { SizeDialog } from "./_components/size-dialog";
import { DeleteSizeDialog } from "./_components/delete-size-dialog";

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
  is_active: boolean;
}

interface LinkedProduct {
  id: string;
  name: string;
  sku: string;
}

interface DeleteError extends Error {
  linkedProducts?: LinkedProduct[];
}

export default function SizesPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const [open, setOpen] = useState(false);
  const [editSize, setEditSize] = useState<Size | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);

  const [formData, setFormData] = useState({
    size: "",
    unit: "kg",
    pack_type: "",
    is_active: true,
  });

  const { data: sizes, isLoading } = useQuery({
    queryKey: ["sizes"],
    queryFn: fetchSizes,
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { size: string; unit: string; pack_type: string }) => {
      const res = await fetch("/api/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      setOpen(false);
      setFormData({ size: "", unit: "kg", pack_type: "", is_active: true });
      addNotification({ type: "success", message: "Size added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add size" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; size: string; unit: string; pack_type: string; is_active: boolean }) => {
      const res = await fetch("/api/sizes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      setOpen(false);
      setEditSize(null);
      setFormData({ size: "", unit: "kg", pack_type: "", is_active: true });
      addNotification({ type: "success", message: "Size updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (data: { id: string; is_active: boolean }) => {
      const res = await fetch("/api/sizes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      addNotification({ type: "success", message: "Status updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update status" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sizes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.error || "Failed to delete") as DeleteError;
        error.linkedProducts = data.linkedProducts || [];
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setLinkedProducts([]);
      addNotification({ type: "success", message: "Size deleted successfully!" });
    },
    onError: (error: Error) => {
      const linked = (error as DeleteError).linkedProducts || [];
      setLinkedProducts(linked);
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editSize) {
      updateMutation.mutate({ id: editSize.id, ...formData });
    } else {
      createMutation.mutate({ size: formData.size, unit: formData.unit, pack_type: formData.pack_type });
    }
  };

  const handleEdit = (size: Size) => {
    setEditSize(size);
    setFormData({ size: size.size, unit: size.unit, pack_type: size.pack_type, is_active: size.is_active });
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleToggle = (size: Size) => {
    toggleMutation.mutate({ id: size.id, is_active: !size.is_active });
  };

  const handleClose = () => {
    setOpen(false);
    setEditSize(null);
    setFormData({ size: "", unit: "kg", pack_type: "", is_active: true });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Sizes</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage product sizes</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Size
        </button>
      </div>

      <SizesTable
        sizes={sizes || []}
        onEdit={handleEdit}
        onDelete={(s) => { setDeleteId(s.id); setDeleteOpen(true); }}
        onToggle={handleToggle}
      />

      <SizeDialog
        open={open}
        editSize={editSize}
        formData={formData}
        isPending={isPending}
        onClose={handleClose}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
      />

      <DeleteSizeDialog
        open={deleteOpen}
        isPending={deleteMutation.isPending}
        linkedProducts={linkedProducts}
        onClose={() => { setDeleteOpen(false); setLinkedProducts([]); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
