"use client";

import { Package, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { type Variant, type PaginationInfo } from "./types";

interface VariantsTableProps {
  variants: Variant[];
  pagination?: PaginationInfo;
  onView: (variant: Variant) => void;
  onEdit: (variant: Variant) => void;
  onDelete: (variant: Variant) => void;
  onPageChange: (page: number) => void;
}

export function VariantsTable({ variants, pagination, onView, onEdit, onDelete, onPageChange }: VariantsTableProps) {
  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-md)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>SKU / Product</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Grade</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Flavor</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Size</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Price</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Status</th>
              <th className="px-4 py-3 text-left text-label-sm" style={{ color: "var(--foreground)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.length > 0 ? variants.map((item, index) => (
              <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors" style={{ backgroundColor: index % 2 === 0 ? "transparent" : "var(--surface-container-low)" }}>
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{item.product.name}</p>
                  <p className="text-code-micro" style={{ color: "var(--accent-gold-muted)" }}>{item.sku}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-[var(--radius-sm)] text-label-sm" style={{ backgroundColor: item.grade === "500M" ? "var(--info-bg)" : "var(--surface-container-low)", color: item.grade === "500M" ? "var(--info)" : "var(--foreground)" }}>
                    {item.grade}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-[var(--radius-sm)] text-code-micro" style={{ backgroundColor: "var(--accent-gold)", color: "white" }}>
                    {item.flavor.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{item.size.size}{item.size.unit}</p>
                  <p className="text-code-micro" style={{ color: "var(--accent-gold-muted)" }}>{item.size.pack_type}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: item.price > 0 ? "var(--accent-gold)" : "var(--error)" }}>
                  {item.price > 0 ? `${item.price} SAR` : "-"}
                </td>
                <td className="px-4 py-3">
                  {item.is_active ? (
                    <span className="px-3 py-1 rounded-full text-code-micro" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>Active</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-code-micro" style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(item)} className="px-3 py-1 rounded-[var(--radius-md)] text-label-sm font-medium cursor-pointer" style={{ color: "var(--accent-gold)", backgroundColor: "var(--surface-container-low)" }}>View</button>
                    <button onClick={() => onEdit(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] cursor-pointer" style={{ color: "var(--accent-gold)" }}><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(item)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--error-bg)] cursor-pointer" style={{ color: "var(--error)" }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "var(--accent-gold-muted)" }} />
                    <p className="font-medium" style={{ color: "var(--accent-gold-muted)" }}>No SKUs found</p>
                    <p className="text-sm" style={{ color: "var(--accent-gold-muted)" }}>Generate or add SKUs manually</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{ color: "var(--accent-gold-muted)" }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] disabled:opacity-50 cursor-pointer" style={{ color: "var(--accent-gold)" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm" style={{ color: "var(--foreground)" }}>Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] disabled:opacity-50 cursor-pointer" style={{ color: "var(--accent-gold)" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
