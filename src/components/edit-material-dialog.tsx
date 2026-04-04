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

interface Material {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price_per_kg: number | null;
}

interface EditMaterialDialogProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMaterialDialog({ material, open, onOpenChange }: EditMaterialDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [pricePerKg, setPricePerKg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(material.name);
      setQuantity(material.quantity.toString());
      setUnit(material.unit || "kg");
      setPricePerKg(material.price_per_kg?.toString() || "");
    }
  }, [open, material.id, material.name, material.quantity, material.unit, material.price_per_kg]);

  const updateMutation = useMutation({
    mutationFn: async (updatedMaterial: { id: number; name: string; quantity: number; unit: string; price_per_kg: number | null }) => {
      const res = await fetch("/api/raw-materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMaterial),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: material.id,
      name,
      quantity: parseFloat(quantity),
      unit,
      price_per_kg: pricePerKg ? parseFloat(pricePerKg) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#4C1D95" }}>Edit Raw Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ borderColor: "#7C3AED20" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Quantity</label>
              <Input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{ borderColor: "#7C3AED20" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-md border"
                style={{ borderColor: "#7C3AED20" }}
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="gm">Gram (gm)</option>
                <option value="pieces">Pieces</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#4C1D95" }}>Price/kg</label>
            <Input
              type="number"
              step="0.01"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              style={{ borderColor: "#7C3AED20" }}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button 
              type="button" 
              onClick={() => onOpenChange(false)}
              style={{ borderColor: "#7C3AED20", color: "#4C1D95" }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              style={{ backgroundColor: "#7C3AED", color: "white" }}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
