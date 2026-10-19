"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import {
  getProjects,
  getAllExpenses,
  createExpense,
  deleteExpense,
} from "@/src/lib/data-service";
import { formatCurrencyINR, formatDate } from "@/src/lib/utils";
import type { Project, Expense, ExpenseCategory } from "@/src/types";
import {
  IndianRupee,
  Plus,
  Filter,
  Trash2,
  Receipt,
  PieChart as PieIcon,
  X,
} from "lucide-react";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Record Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Hardware");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setDate(new Date().toISOString().split("T")[0]);
      try {
        setLoading(true);
        const [userProjects, allExp] = await Promise.all([
          getProjects(user.uid),
          getAllExpenses(user.uid),
        ]);

        setProjects(userProjects);
        setExpenses(allExp);
        if (userProjects.length > 0 && !modalProjectId) {
          setModalProjectId(userProjects[0].id);
        }
      } catch (err) {
        console.error("Error loading expenses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, modalProjectId]);

  // Filtered expenses
  const displayedExpenses =
    selectedProjectId === "all"
      ? expenses
      : expenses.filter((e) => e.projectId === selectedProjectId);

  // Budget calculations
  const totalBudget =
    selectedProjectId === "all"
      ? projects.reduce((sum, p) => sum + (p.budget || 0), 0)
      : projects.find((p) => p.id === selectedProjectId)?.budget || 0;

  const totalSpent = displayedExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const budgetRemaining = totalBudget - totalSpent;
  const budgetUtilization =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const isOverBudget = totalSpent > totalBudget;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  displayedExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  });

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setModalError(null);

    const targetProject = projects.find((p) => p.id === modalProjectId);
    if (!targetProject) {
      setModalError("Please select a valid project.");
      return;
    }

    try {
      const created = await createExpense(
        modalProjectId,
        {
          projectId: modalProjectId,
          projectName: targetProject.name,
          description: description.trim(),
          category,
          amount: Number(amount) || 0,
          date,
          creatorId: user.uid,
          creatorName: user.displayName,
          notes: notes.trim() || undefined,
        },
        user
      );

      setExpenses([created, ...expenses]);
      setShowModal(false);
      setDescription("");
      setAmount("");
      setNotes("");
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to record expense.");
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user) return;
    if (!confirm(`Delete expense record "${expense.description}" of ₹${expense.amount}?`))
      return;

    try {
      await deleteExpense(expense.projectId, expense.id, user);
      setExpenses(expenses.filter((e) => e.id !== expense.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete expense record.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">
          Loading financial ledgers...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <IndianRupee className="w-6 h-6 text-blue-400" />
              Project Financials & Budget Tracking
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Controlling project cost deviations and procurement ledgers in INR (KTU PBMET504 Controlling Module)
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Procurement / Expense</span>
          </button>
        </div>

        {/* Filter by project selector */}
        <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-medium">Filter by Project:</span>
            <select
              aria-label="Filter expenses by project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#050608] border border-[#1B2434] text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Projects Aggregated</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
            <span className="text-xs text-slate-400 font-medium">Allocated Budget Cap</span>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {formatCurrencyINR(totalBudget)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sanctioned engineering funds</p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
            <span className="text-xs text-slate-400 font-medium">Actual Expenditure</span>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {formatCurrencyINR(totalSpent)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {displayedExpenses.length} logged invoices
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
            <span className="text-xs text-slate-400 font-medium">Remaining Liquidity</span>
            <div
              className={`mt-2 text-2xl font-bold ${
                isOverBudget ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {formatCurrencyINR(budgetRemaining)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isOverBudget ? "Cost overrun occurred!" : "Available for procurement"}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
            <span className="text-xs text-slate-400 font-medium">Budget Utilization</span>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {budgetUtilization}%
            </div>
            <div className="w-full bg-[#101725] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetUtilization > 100 ? "bg-rose-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Breakdown Chips */}
        <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-blue-400" />
            Expenditure by Cost Center Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const catPercent = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
              return (
                <div
                  key={cat}
                  className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] text-xs space-y-1"
                >
                  <span className="text-[11px] text-slate-400 font-medium block truncate">
                    {cat}
                  </span>
                  <p className="font-bold text-slate-200">{formatCurrencyINR(amt)}</p>
                  <span className="text-[10px] text-blue-400 block">{catPercent}% of total</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Ledger Table */}
        <div className="rounded-xl bg-[#0B0F18] border border-[#1B2434] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080B12] border-b border-[#1B2434] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2434]">
                {displayedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#101725]/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-200">{exp.description}</p>
                      {exp.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{exp.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{exp.projectName || "General"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.creatorName}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-200 font-mono">
                      {formatCurrencyINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete Expense Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 text-xs">
            <div className="relative w-full max-w-lg bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  Record Project Procurement / Expense
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="m-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Target Project</label>
                  <select
                    aria-label="Target Project for Expense"
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Item Description / Invoice Particulars <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Livox Mid-360 LiDAR Sensor Unit"
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Cost Category</label>
                    <select
                      aria-label="Cost Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Hardware">Hardware & Sensors</option>
                      <option value="Software">Software & Cloud Services</option>
                      <option value="Labor">Fabrication & Machining Labor</option>
                      <option value="Testing">Testing & Certification</option>
                      <option value="Travel">Field Trials & Travel</option>
                      <option value="Documentation">Documentation & Reports</option>
                      <option value="Misc">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                      Amount (INR) <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="145000"
                      className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Procurement Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Vendor / Grant Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Procured via vendor PO #KTU-2026-081..."
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-[#1B2434] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-[#101725] text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
