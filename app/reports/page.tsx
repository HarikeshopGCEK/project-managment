"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import {
  getProjects,
  getTasksByProject,
  getExpensesByProject,
  getProjectMembers,
  calculateProjectMetrics,
  type ProjectMetrics,
} from "@/src/lib/data-service";
import { formatCurrencyINR, formatDate } from "@/src/lib/utils";
import { ProjectStatusBadge, PriorityBadge, TaskStatusBadge } from "@/src/components/ui/badges";
import type { Project, Task, Expense, ProjectMember } from "@/src/types";
import { BarChart3, Printer, Filter } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    async function loadInitial() {
      if (!user) return;
      setReportDate(new Date().toLocaleDateString("en-IN"));
      try {
        setLoading(true);
        const userProjects = await getProjects(user.uid);
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setSelectedProjectId(userProjects[0].id);
        }
      } catch (err) {
        console.error("Error loading projects for report:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [user]);

  useEffect(() => {
    async function loadProjectDetails() {
      if (!selectedProjectId) return;
      try {
        const targetProj = projects.find((p) => p.id === selectedProjectId);
        if (!targetProj) return;

        const [taskList, expList, memList, met] = await Promise.all([
          getTasksByProject(selectedProjectId),
          getExpensesByProject(selectedProjectId),
          getProjectMembers(selectedProjectId),
          calculateProjectMetrics(selectedProjectId),
        ]);

        setProject(targetProj);
        setTasks(taskList);
        setExpenses(expList);
        setMembers(memList);
        setMetrics(met);
      } catch (err) {
        console.error("Error loading project report data:", err);
      }
    }

    loadProjectDetails();
  }, [selectedProjectId, projects]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">
          Generating project audit report...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - Hidden during print */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Audit & Evaluation
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5 mt-1.5">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Project Evaluation & Audit Reports
            </h1>
            <p className="text-xs text-slate-400">
              Printable academic engineering progress, variance, and financial utilization summary
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Project Selector - Hidden during print */}
        <div className="no-print p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-medium">Select Target Project:</span>
            <select
              aria-label="Select Target Project for Report"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#050608] border border-[#1B2434] text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-slate-500 text-[11px]">
            Report Generated on: {reportDate || "Academic Term"}
          </span>
        </div>

        {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Formal Academic Header */}
          <div className="border-b border-[#1B2434] print:border-black pb-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 print:text-blue-700 font-bold">
                  APJ Abdul Kalam Technological University (KTU)
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 print:text-black mt-1">
                  PBMET504 Management for Engineers (2024 Scheme)
                </h2>
                <p className="text-xs text-slate-400 print:text-gray-700 mt-0.5">
                  Project Planning, Task Allocation & Financial Variance Audit Report
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="px-2.5 py-1 rounded bg-[#080B12] print:bg-gray-100 border border-[#1B2434] print:border-gray-400 font-mono text-[11px]">
                  DOC-ID: {project?.id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Project Overview Section */}
          {project && metrics && (
            <>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100 print:text-black">
                    {project.name}
                  </h3>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-[#080B12] print:bg-gray-50 border border-[#1B2434] print:border-gray-300 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 print:text-gray-600 block">
                      Lead / Owner
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black mt-0.5 block">
                      {project.ownerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 print:text-gray-600 block">
                      Project Period
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black mt-0.5 block">
                      {formatDate(project.startDate)} → {formatDate(project.deadline)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 print:text-gray-600 block">
                      Sanctioned Budget
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black mt-0.5 block">
                      {formatCurrencyINR(project.budget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 print:text-gray-600 block">
                      Personnel Roster
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black mt-0.5 block">
                      {members.length} Engineers
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Performance Summary Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 print:text-black uppercase tracking-wider">
                  Quantitative Performance Matrix
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#080B12] print:bg-gray-50 border border-[#1B2434] print:border-gray-300">
                    <span className="text-[10px] text-slate-500 print:text-gray-600">
                      Deliverable Progress
                    </span>
                    <div className="text-xl font-bold text-slate-100 print:text-black mt-1">
                      {metrics.completionRate}%
                    </div>
                    <p className="text-[10px] text-slate-500 print:text-gray-600 mt-1">
                      {metrics.completedTasks} completed of {metrics.totalTasks} total
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080B12] print:bg-gray-50 border border-[#1B2434] print:border-gray-300">
                    <span className="text-[10px] text-slate-500 print:text-gray-600">
                      Schedule Deviations
                    </span>
                    <div
                      className={`text-xl font-bold mt-1 ${
                        metrics.overdueTasks > 0 ? "text-rose-400 print:text-red-700" : "text-emerald-400 print:text-green-700"
                      }`}
                    >
                      {metrics.overdueTasks} Overdue
                    </div>
                    <p className="text-[10px] text-slate-500 print:text-gray-600 mt-1">
                      {metrics.inProgressTasks} active, {metrics.blockedTasks} blocked
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080B12] print:bg-gray-50 border border-[#1B2434] print:border-gray-300">
                    <span className="text-[10px] text-slate-500 print:text-gray-600">
                      Actual Cost Incurred
                    </span>
                    <div className="text-xl font-bold text-slate-100 print:text-black mt-1">
                      {formatCurrencyINR(metrics.totalExpenses)}
                    </div>
                    <p className="text-[10px] text-slate-500 print:text-gray-600 mt-1">
                      {metrics.budgetUtilization}% of sanctioned budget
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080B12] print:bg-gray-50 border border-[#1B2434] print:border-gray-300">
                    <span className="text-[10px] text-slate-500 print:text-gray-600">
                      Cost Variance
                    </span>
                    <div
                      className={`text-xl font-bold mt-1 ${
                        metrics.isOverBudget ? "text-rose-400 print:text-red-700" : "text-emerald-400 print:text-green-700"
                      }`}
                    >
                      {formatCurrencyINR(metrics.budgetRemaining)}
                    </div>
                    <p className="text-[10px] text-slate-500 print:text-gray-600 mt-1">
                      {metrics.isOverBudget ? "Cost overrun" : "Favorable variance"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks Breakdown Table */}
              <div className="space-y-3 print-break-inside-avoid">
                <h4 className="text-xs font-bold text-slate-200 print:text-black uppercase tracking-wider">
                  Deliverables & Work Breakdown Status
                </h4>
                <div className="overflow-x-auto border border-[#1B2434] print:border-gray-300 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080B12] print:bg-gray-100 text-slate-400 print:text-gray-700 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Assignee</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B2434] print:divide-gray-300">
                      {tasks.map((t) => (
                        <tr key={t.id} className="hover:bg-[#101725]/30">
                          <td className="py-2 px-3 font-medium text-slate-200 print:text-black">
                            {t.title}
                          </td>
                          <td className="py-2 px-3 text-slate-400 print:text-gray-800">
                            {t.assigneeName || "Unassigned"}
                          </td>
                          <td className="py-2 px-3">
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td className="py-2 px-3">
                            <TaskStatusBadge status={t.status} />
                          </td>
                          <td className="py-2 px-3 text-slate-400 print:text-gray-800">
                            {formatDate(t.dueDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Expenses Breakdown Table */}
              <div className="space-y-3 print-break-inside-avoid">
                <h4 className="text-xs font-bold text-slate-200 print:text-black uppercase tracking-wider">
                  Financial Expenditure Particulars
                </h4>
                <div className="overflow-x-auto border border-[#1B2434] print:border-gray-300 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080B12] print:bg-gray-100 text-slate-400 print:text-gray-700 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B2434] print:divide-gray-300">
                      {expenses.map((exp) => (
                        <tr key={exp.id}>
                          <td className="py-2 px-3 font-medium text-slate-200 print:text-black">
                            {exp.description}
                          </td>
                          <td className="py-2 px-3 text-slate-400 print:text-gray-800">
                            {exp.category}
                          </td>
                          <td className="py-2 px-3 text-slate-400 print:text-gray-800">
                            {formatDate(exp.date)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-200 print:text-black">
                            {formatCurrencyINR(exp.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures Footer for Academic Evaluation */}
              <div className="pt-8 border-t border-[#1B2434] print:border-gray-400 print-break-inside-avoid grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-8">
                  <div className="border-b border-[#1B2434] print:border-black mx-auto w-40" />
                  <p className="text-[11px] text-slate-400 print:text-gray-700 font-medium">
                    Project Leader / Lead Engineer
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-[#1B2434] print:border-black mx-auto w-40" />
                  <p className="text-[11px] text-slate-400 print:text-gray-700 font-medium">
                    Faculty Advisor / Project Guide
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-[#1B2434] print:border-black mx-auto w-40" />
                  <p className="text-[11px] text-slate-400 print:text-gray-700 font-medium">
                    KTU Course Evaluator / HoD
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
