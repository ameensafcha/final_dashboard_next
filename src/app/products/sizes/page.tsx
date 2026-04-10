"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ruler, Edit, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";

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
  const [linkedProducts, setLinkedProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  
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
        method: "PATCH",
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
      updateMutation.mutate({ id: editSize.id, size: formData.size, unit: formData.unit, pack_type: formData.pack_type, is_active: formData.is_active });
    } else {
      createMutation.mutate({ size: formData.size, unit: formData.unit, pack_type: formData.pack_type } as typeof formData);
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const sizesList: Size[] = sizes || [];

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

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Size</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Unit</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Pack Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sizesList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{item.size}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.unit}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{item.pack_type}</td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => handleToggle(item)}
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
            {sizesList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Ruler className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No sizes found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Add your first size</p>
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
              {editSize ? "Edit Size" : "Add Size"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Size</label>
                <Input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g., 1, 500, 100"
                  required
                  style={{ borderColor: "#E8C54720" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#E8C54720" }}
                >
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Pack Type</label>
              <Input
                type="text"
                value={formData.pack_type}
                onChange={(e) => setFormData({ ...formData, pack_type: e.target.value })}
                placeholder="e.g., Bottle, Box, Pouch"
                required
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
            {editSize && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                  Status
                </label>
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
              <Button type="button" onClick={handleClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: "#E8C547", color: "white" }}
              >
                {editSize ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Saving..." : "Save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setLinkedProducts([]); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Size</DialogTitle>
          </DialogHeader>
          {linkedProducts.length > 0 ? (
            <div className="space-y-3">
              <p style={{ color: "#DC2626" }}>
                This size is linked to {linkedProducts.length} product(s). Please delete them first:
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
              Are you sure you want to delete this size?
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
    </div>
  );
}