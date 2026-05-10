"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { z } from "zod";
import { flavorSchema, updateFlavorSchema } from "@/lib/validations/flavor";
import { useUIStore } from "@/lib/stores";
import { FlavorsTable } from "./_components/flavors-table";
import { FlavorDialog } from "./_components/flavor-dialog";
import { DeleteFlavorDialog } from "./_components/delete-flavor-dialog";
import { ViewFlavorDialog } from "./_components/view-flavor-dialog";

async function fetchFlavors() {
  const res = await fetch("/api/flavors");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

type Flavor = z.infer<typeof flavorSchema> & { id: string };

interface LinkedProduct {
  id: string;
  name: string;
  sku: string;
}

interface DeleteError extends Error {
  linkedProducts?: LinkedProduct[];
}

export default function FlavorsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const [open, setOpen] = useState(false);
  const [editFlavor, setEditFlavor] = useState<Flavor | null>(null);
  const [viewFlavor, setViewFlavor] = useState<Flavor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    ingredients: [] as string[],
    is_active: true,
  });

  const { data: flavors, isLoading } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; short_code: string; ingredients: string[] }) => {
      const res = await fetch("/api/flavors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, short_code: data.short_code, ingredients: data.ingredients.join(", ") }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setOpen(false);
      setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
      addNotification({ type: "success", message: "Flavor added successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to add flavor" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateFlavorSchema>) => {
      const res = await fetch("/api/flavors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setOpen(false);
      setEditFlavor(null);
      setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
      addNotification({ type: "success", message: "Flavor updated successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message || "Failed to update" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/flavors?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.error || "Failed to delete") as DeleteError;
        error.linkedProducts = data.linkedProducts || [];
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setLinkedProducts([]);
      addNotification({ type: "success", message: "Flavor deleted successfully!" });
    },
    onError: (error: Error) => {
      const linked = (error as DeleteError).linkedProducts || [];
      setLinkedProducts(linked);
      addNotification({ type: "error", message: error.message || "Failed to delete" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredientsStr = formData.ingredients.join(", ");
    if (editFlavor) {
      updateMutation.mutate({ id: editFlavor.id, name: formData.name, short_code: formData.short_code, ingredients: ingredientsStr, is_active: formData.is_active });
    } else {
      createMutation.mutate({ name: formData.name, short_code: formData.short_code, ingredients: formData.ingredients });
    }
  };

  const handleEdit = (flavor: Flavor) => {
    setEditFlavor(flavor);
    const ingredientList = flavor.ingredients ? flavor.ingredients.split(",").map((i) => i.trim()).filter((i) => i) : [];
    setFormData({ name: flavor.name, short_code: flavor.short_code, ingredients: ingredientList, is_active: flavor.is_active });
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditFlavor(null);
    setFormData({ name: "", short_code: "", ingredients: [], is_active: true });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const flavorsList: Flavor[] = flavors || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Flavors</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage product flavors</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Flavor
        </button>
      </div>

      <FlavorsTable
        flavors={flavorsList}
        onView={(f) => setViewFlavor(f)}
        onEdit={handleEdit}
        onDelete={(f) => { setDeleteId(f.id); setDeleteOpen(true); }}
      />

      <FlavorDialog
        open={open}
        editFlavor={editFlavor}
        formData={formData}
        ingredientInput={ingredientInput}
        isPending={isPending}
        onClose={handleClose}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onIngredientInputChange={setIngredientInput}
        onAddIngredient={() => {
          if (ingredientInput.trim()) {
            setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, ingredientInput.trim()] }));
            setIngredientInput("");
          }
        }}
        onRemoveIngredient={(index) => {
          setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
        }}
        onSubmit={handleSubmit}
      />

      <DeleteFlavorDialog
        open={deleteOpen}
        isPending={deleteMutation.isPending}
        linkedProducts={linkedProducts}
        onClose={() => { setDeleteOpen(false); setLinkedProducts([]); }}
        onConfirm={handleDelete}
      />

      <ViewFlavorDialog
        flavor={viewFlavor}
        onClose={() => setViewFlavor(null)}
      />
    </div>
  );
}
