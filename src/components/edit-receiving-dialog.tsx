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
  unit: string;
}

interface ReceivingMaterial {
  id: string;
  raw_material_id: number;
  raw_material: RawMaterial;
  quantity: number;
  unit: string;
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
  const [selectedUnit, setSelectedUnit] = useState("");
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
      setSelectedUnit(receiving.unit || "");
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
          quantity: parseFloat(data.quantity),
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
          <DialogTitle style={{ color: "#1A1A1A" }}>Edit Receiving</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Raw Material</label>
            <select
              value={formData.raw_material_id}
              onChange={(e) => {
                const selectedMaterial = allMaterials.find((rm) => rm.id === parseInt(e.target.value));
                setFormData({ ...formData, raw_material_id: e.target.value });
                setSelectedUnit(selectedMaterial?.unit || "");
              }}
              required
              className="w-full px-3 py-2 rounded-md border"
              style={{ borderColor: "#E8C54720" }}
            >
              {allMaterials.map((rm) => (
                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Quantity {selectedUnit ? `(${selectedUnit})` : ""}</label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Rate per {selectedUnit || "kg"}</label>
              <Input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="0.00"
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Supplier</label>
            <Input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
              style={{ borderColor: "#E8C54720" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{ borderColor: "#E8C54720" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-md border"
              style={{ borderColor: "#E8C54720" }}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" onClick={() => onOpenChange(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} style={{ backgroundColor: "#E8C547", color: "white" }}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}