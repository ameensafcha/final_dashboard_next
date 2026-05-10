"use client";

import { ShoppingBag, Edit, Trash2 } from "lucide-react";
import { type Product } from "./types";

interface ProductsTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export function ProductsTable({ products, onView, onEdit, onDelete, onToggleStatus }: ProductsTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Product Name</th>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Flavors</th>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Active</th>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Inactive</th>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Status</th>
          <th className="px-6 py-4 text-left text-label-sm" style={{ color: "var(--accent-gold-muted)" }}>Actions</th>
        </tr>
      </thead>
      {(!products || products.length === 0) ? (
        <tbody>
          <tr>
            <td colSpan={6} className="px-6 py-20 text-center">
              <div className="flex flex-col items-center gap-2 opacity-20">
                <ShoppingBag className="w-16 h-16" />
                <p className="font-bold text-xl">No products yet</p>
                <p className="text-sm">Click Add Product to start your catalog</p>
              </div>
            </td>
          </tr>
        </tbody>
      ) : (
        <tbody>
          {products.map((item: Product) => (
            <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--surface-container-low)] group-hover:bg-[var(--surface-container)] transition-colors">
                    <ShoppingBag className="w-5 h-5" style={{ color: "var(--accent-gold)" }} />
                  </div>
                  <span className="font-bold" style={{ color: "var(--foreground)" }}>{item.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {item.product_flavors.map((pf, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-[var(--radius-sm)] text-code-micro" style={{ backgroundColor: "var(--surface-container-low)", color: "var(--accent-gold-muted)" }}>{pf.flavor.name}</span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-bold" style={{ color: "var(--success)" }}>{item.variants_count?.active || 0}</span>
              </td>
              <td className="px-6 py-4">
                <span className="font-bold" style={{ color: "var(--error)" }}>{item.variants_count?.inactive || 0}</span>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onToggleStatus(item)}
                  className={`px-3 py-1 rounded-full text-code-micro cursor-pointer transition-all ${item.is_active ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--error-bg)] text-[var(--error)]'}`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onView(item)} className="px-4 py-1.5 rounded-[var(--radius-md)] text-label-sm font-bold cursor-pointer" style={{ backgroundColor: "var(--surface-container-low)", color: "var(--accent-gold-muted)" }}>
                    View
                  </button>
                  <button onClick={() => onEdit(item)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-container-low)] cursor-pointer" style={{ color: "var(--accent-gold-muted)" }}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(item)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-bg)] cursor-pointer" style={{ color: "var(--error)" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </table>
  );
}
