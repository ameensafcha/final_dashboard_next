"use client";

import { X } from "lucide-react";
import { type ReactNode } from "react";

interface ProductDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function ProductDialog({ open, title, onClose, children }: ProductDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: "#F5F4EE" }}>
          <h3 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F4EE] transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
