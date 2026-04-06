"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddMaterialDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [pricePerKg, setPricePerKg] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (newMaterial: { name: string; quantity: number; unit: string; price_per_kg: number | null }) => {
      const res = await fetch("/api/raw-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaterial),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setOpen(false);
      setName("");
      setQuantity("");
      setUnit("kg");
      setPricePerKg("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      quantity: parseFloat(quantity),
      unit,
      price_per_kg: pricePerKg ? parseFloat(pricePerKg) : null,
    });
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: "#F97316", color: "white" }}
      >
        <span className="w-5 h-5 font-bold">+</span>
        Add Material
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Add Raw Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Quantity</label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  style={{ borderColor: "#E8C54720" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border"
                  style={{ borderColor: "#E8C54720" }}
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
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Price/kg</label>
              <Input
                type="number"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                style={{ borderColor: "#E8C54720" }}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button 
                type="button" 
                onClick={() => setOpen(false)}
                style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                style={{ backgroundColor: "#E8C547", color: "white" }}
              >
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
