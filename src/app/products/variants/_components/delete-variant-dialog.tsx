"use client";

import { AlertCircle, Loader2 } from "lucide-react";

interface DeleteVariantDialogProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteVariantDialog({ open, isPending, onClose, onConfirm }: DeleteVariantDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200" style={{ backgroundColor: "#FBFBF7" }}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Delete SKU</h3>
            <p className="text-gray-500 mt-2">Are you sure you want to delete this SKU? This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-semibold border transition-all text-gray-600 hover:bg-gray-50 cursor-pointer" style={{ borderColor: "#E8E7E1" }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: "#DC2626" }}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete SKU
          </button>
        </div>
      </div>
    </div>
  );
}
