"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, Edit, Trash2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditReceivingDialog } from "@/components/edit-receiving-dialog";
import { useUIStore } from "@/lib/stores";

async function fetchReceiving() {
  const res = await fetch("/api/receiving");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchRawMaterials() {
  const res = await fetch("/api/raw-materials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface RawMaterial {
  id: number;
  name: string;
}

interface ReceivingWithMaterial {
  id: string;
  raw_material_id: number;
  raw_material: RawMaterial;
  quantity: number;
  rate: number | null;
  supplier: string;
  date: Date;
  notes: string | null;
}

export default function ReceivingPage() {
  const queryClient = useQueryClient();
  const { addNotification, removeNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [editReceiving, setEditReceiving] = useState<ReceivingWithMaterial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    raw_material_id: "",
    quantity: "",
    rate: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: receivings, isLoading, isFetching } = useQuery({
    queryKey: ["receiving"],
    queryFn: fetchReceiving,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  });

  const { data: rawMaterials, isFetching: isFetchingMaterials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_material_id: parseInt(data.raw_material_id),
          quantity: parseInt(data.quantity),
          rate: data.rate ? parseFloat(data.rate) : null,
          supplier: data.supplier,
          date: data.date || new Date().toISOString(),
          notes: data.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiving"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setOpen(false);
      setFormData({
        raw_material_id: "",
        quantity: "",
        rate: "",
        supplier: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      addNotification({ type: "success", message: "Receiving added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add receiving" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/receiving?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiving"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Receiving deleted successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }}></div>
    </div>
  );

  const receivingList: ReceivingWithMaterial[] = receivings || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4C1D95" }}>Receiving</h1>
          <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Track material receipts</p>
        </div>
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Add Receiving
        </button>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#7C3AED20" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAF5FF" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Material</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Rate/kg</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Supplier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Notes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#4C1D95" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivingList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" 
                }}
              >
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#4C1D95" }}>
                  {item.raw_material?.name || "Unknown"}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>{item.quantity}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: item.rate ? "#7C3AED" : "#A78BFA" }}>
                  {item.rate ? `$${item.rate}` : "-"}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: "#7C3AED" }}>
                  {item.rate ? `$${(item.quantity * item.rate).toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#4C1D95" }}>{item.supplier}</td>
                <td className="px-4 py-3 text-sm" style={{ color: "#A78BFA" }}>
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#A78BFA" }}>{item.notes || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditReceiving(item)}
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
            {receivingList.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDownLeft className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No receiving records</p>
                    <p className="text-sm" style={{ color: "#A78BFA" }}>Add your first receiving entry</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Receiving Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>Add Receiving</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Raw Material</label>
              <select
                value={formData.raw_material_id}
                onChange={(e) => setFormData({ ...formData, raw_material_id: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-md border"
                style={{ borderColor: "#7C3AED20" }}
              >
                <option value="">Select Material</option>
                {rawMaterials?.map((rm: RawMaterial) => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Quantity</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  style={{ borderColor: "#7C3AED20" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Rate/kg ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="0.00"
                  style={{ borderColor: "#7C3AED20" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Supplier</label>
              <Input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                required
                style={{ borderColor: "#7C3AED20" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ borderColor: "#7C3AED20" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border"
                style={{ borderColor: "#7C3AED20" }}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={() => setOpen(false)} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} style={{ backgroundColor: "#7C3AED", color: "white" }}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Receiving Dialog */}
      {editReceiving && (
        <EditReceivingDialog
          receiving={editReceiving}
          open={!!editReceiving}
          onOpenChange={(open) => !open && setEditReceiving(null)}
          allMaterials={rawMaterials || []}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4C1D95" }}>Delete Receiving</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#4C1D95" }}>
            Are you sure you want to delete this receiving record? This will also decrease the raw material quantity.
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