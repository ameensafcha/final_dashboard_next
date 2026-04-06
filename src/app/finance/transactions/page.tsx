"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";
import { useState } from "react";

async function fetchTransactions() {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  reference_id: string | null;
  person: string | null;
  note: string | null;
  created_at: string;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  
  const [formData, setFormData] = useState({
    type: "sale",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference_id: "",
    person: "",
    note: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
      resetForm();
      addNotification({ type: "success", message: "Transaction added!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; type: string; amount: string; date: string; reference_id: string; person: string; note: string }) => {
      const res = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
      setEditTransaction(null);
      resetForm();
      addNotification({ type: "success", message: "Transaction updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Transaction deleted!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "sale",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      reference_id: "",
      person: "",
      note: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      addNotification({ type: "error", message: "Please enter valid amount" });
      return;
    }

    if (editTransaction) {
      updateMutation.mutate({ ...formData, id: editTransaction.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date).toISOString().split("T")[0],
      reference_id: transaction.reference_id || "",
      person: transaction.person || "",
      note: transaction.note || "",
    });
    setEditTransaction(transaction);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditTransaction(null);
    resetForm();
  };

  const transactions: Transaction[] = data?.data || [];
  const filteredTransactions = typeFilter 
    ? transactions.filter(t => t.type === typeFilter)
    : transactions;

  const totalSales = transactions.filter(t => t.type === "sale").reduce((sum, t) => sum + t.amount, 0);
  const totalPurchases = transactions.filter(t => t.type === "purchase").reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalSales - totalPurchases;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Transactions</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage sales and purchases</p>
        </div>
        <button 
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#F97316", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm font-medium" style={{ color: "#16A34A" }}>Total Sales</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{totalSales.toFixed(2)} SAR</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#DC262630", backgroundColor: "#FEF2F2" }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-5 h-5" style={{ color: "#DC2626" }} />
            <span className="text-sm font-medium" style={{ color: "#DC2626" }}>Total Purchases</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>{totalPurchases.toFixed(2)} SAR</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="text-sm font-medium" style={{ color: "#E8C547" }}>Net Total</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#E8C547" }}>{netTotal.toFixed(2)} SAR</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Filter:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm cursor-pointer"
          style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}
        >
          <option value="">All</option>
          <option value="sale">Sales</option>
          <option value="purchase">Purchases</option>
        </select>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Person</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Note</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: item.type === "sale" ? "#DCFCE7" : "#FEE2E2",
                      color: item.type === "sale" ? "#16A34A" : "#DC2626"
                    }}
                  >
                    {item.type === "sale" ? "Sale" : "Purchase"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{item.amount} SAR</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{new Date(item.date).toLocaleDateString()}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{item.person || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm" style={{ color: "#C9A83A" }}>{item.note || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-yellow-100 cursor-pointer" 
                      style={{ color: "#E8C547" }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-red-100 cursor-pointer" 
                      style={{ color: "#DC2626" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No transactions found</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Add your first transaction</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              {editTransaction ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{ borderColor: "#E8C54720" }}
                required
              >
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Amount (SAR) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
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
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Person</label>
              <Input
                type="text"
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                placeholder="Enter person name"
                style={{ borderColor: "#E8C54720" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Note</label>
              <Input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Optional note"
                style={{ borderColor: "#E8C54720" }}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={handleClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: "#E8C547", color: "white" }}
              >
                {editTransaction ? (updateMutation.isPending ? "Saving..." : "Save") : (createMutation.isPending ? "Saving..." : "Create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Transaction</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#1A1A1A" }}>
            Are you sure you want to delete this transaction?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setDeleteOpen(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
              Cancel
            </Button>
            <Button 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)} 
              disabled={deleteMutation.isPending}
              style={{ backgroundColor: "#DC2626", color: "white" }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
