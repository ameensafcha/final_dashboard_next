"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FlavorFormData {
  name: string;
  short_code: string;
  ingredients: string[];
  is_active: boolean;
}

interface FlavorDialogProps {
  open: boolean;
  editFlavor: { id: string } | null;
  formData: FlavorFormData;
  ingredientInput: string;
  isPending: boolean;
  onClose: () => void;
  onChange: (field: string, value: string | boolean | string[]) => void;
  onIngredientInputChange: (value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FlavorDialog({
  open,
  editFlavor,
  formData,
  ingredientInput,
  isPending,
  onClose,
  onChange,
  onIngredientInputChange,
  onAddIngredient,
  onRemoveIngredient,
  onSubmit,
}: FlavorDialogProps) {
  if (!open) return null;

  const generateShortCode = (name: string): string => {
    const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const generatedCode = generateShortCode(newName);
    onChange("name", newName);
    if (!editFlavor && generatedCode) {
      onChange("short_code", generatedCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E8C54720" }}>
          <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{editFlavor ? "Edit Flavor" : "Add Flavor"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1" aria-label="Close">✕</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Name</label>
              <Input type="text" value={formData.name} onChange={handleNameChange} placeholder="e.g., Chocolate, Vanilla, Strawberry" required style={{ borderColor: "#E8C54720" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Short Code (Auto-generated)</label>
              <Input type="text" value={formData.short_code} onChange={(e) => onChange("short_code", e.target.value.toUpperCase())} placeholder="e.g., CH, VAN" maxLength={3} required style={{ borderColor: "#E8C54720" }} />
              <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>First 2 letters of first 2 words</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Ingredients</label>
              <div className="space-y-2">
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input type="text" value={ing} onChange={(e) => {
                      const newIngredients = [...formData.ingredients];
                      newIngredients[idx] = e.target.value;
                      onChange("ingredients", newIngredients);
                    }} placeholder="Ingredient name" className="flex-1" style={{ borderColor: "#E8C54720" }} />
                    <button type="button" onClick={() => onRemoveIngredient(idx)} className="px-3 py-2 rounded-lg hover:bg-red-100 cursor-pointer transition-colors" style={{ color: "#DC2626" }}>✕</button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input type="text" value={ingredientInput} onChange={(e) => onIngredientInputChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && ingredientInput.trim()) { e.preventDefault(); onAddIngredient(); } }}
                    placeholder="Type ingredient and press Enter or click Add" className="flex-1" style={{ borderColor: "#E8C54720" }} />
                  <button type="button" onClick={onAddIngredient} className="px-4 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: "#E8C547" }}>Add</button>
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: "#C9A83A" }}>Add ingredients one by one</p>
            </div>
            {editFlavor && (
              <div className="flex items-center gap-2 pt-2">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Status</label>
                <button type="button" onClick={() => onChange("is_active", !formData.is_active)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: formData.is_active ? "#E8C547" : "#DC2626" }}>
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: formData.is_active ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4 mt-4 border-t" style={{ borderColor: "#E8C54720" }}>
              <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>Cancel</Button>
              <Button type="submit" disabled={isPending} style={{ backgroundColor: "#E8C547", color: "white" }} className="hover:opacity-90">
                {editFlavor ? (isPending ? "Saving..." : "Save Changes") : (isPending ? "Saving..." : "Add Flavor")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
