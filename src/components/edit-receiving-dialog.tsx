"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RawMaterial {
  id: number;
  name: string;
}

interface ReceivingMaterial {
  id: string;
  raw_material_id: number;
  raw_material: RawMaterial;
  quantity: number;
  rate: number | null;
  supplier: string;
  date: Date;
  notes: string | null;
}

interface EditReceivingDialogProps {
  receiving: ReceivingMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allMaterials: RawMaterial[];
}

export function EditReceivingDialog({ receiving, open, onOpenChange, allMaterials }: EditReceivingDialogProps) {
  const [formData, setFormData] = useState({
    raw_material_id: "",
    quantity: "",
    rate: "",
    supplier: "",
    date: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFormData({
        raw_material_id: receiving.raw_material_id.toString(),
        quantity: receiving.quantity.toString(),
        rate: receiving.rate?.toString() || "",
        supplier: receiving.supplier,
        date: new Date(receiving.date).toISOString().split("T")[0],
        notes: receiving.notes || "",
      });
    }
  }, [open, receiving.id]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const res = await fetch("/api/receiving", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          raw_material_id: parseInt(data.raw_material_id),
          quantity: parseInt(data.quantity),
          rate: data.rate ? parseFloat(data.rate) : null,
          supplier: data.supplier,
          date: data.date,
          notes: data.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiving"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ ...formData, id: receiving.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#4C1D95" }}>Edit Receiving</DialogTitle>
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
              {allMaterials.map((rm) => (
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
            <Button type="button" onClick={() => onOpenChange(false)} style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} style={{ backgroundColor: "#7C3AED", color: "white" }}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}