"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import {
  getProjects,
  calculateProjectMetrics,
  getProjectMembers,
  type ProjectMetrics,
} from "@/src/lib/data-service";
import { formatCurrencyINR, formatDate } from "@/src/lib/utils";
import { ProjectStatusBadge } from "@/src/components/ui/badges";
import type { Project, ProjectMember } from "@/src/types";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, ProjectMetrics>>({});
  const [membersMap, setMembersMap] = useState<Record<string, ProjectMember[]>>({});
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "name" | "budget" | "created">("deadline");

  useEffect(() => {
    async function loadProjects() {
      if (!user) return;
      try {
        setLoading(true);
        const userProjects = await getProjects(user.uid);
        setProjects(userProjects);

        const mObj: Record<string, ProjectMetrics> = {};
        const memObj: Record<string, ProjectMember[]> = {};

        for (const p of userProjects) {
          mObj[p.id] = await calculateProjectMetrics(p.id);
          memObj[p.id] = await getProjectMembers(p.id);
        }
        setMetricsMap(mObj);
        setMembersMap(memObj);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [user]);

  // Filtering & Sorting
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "budget") {
        return (b.budget || 0) - (a.budget || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <FolderKanban className="w-6 h-6 text-blue-400" />
              Engineering Projects
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Workspaces you own or collaborate on with team role delegation
            </p>
          </div>

          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Engineering Project</span>
          </Link>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, keywords, or specs..."
              className="w-full pl-9 pr-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#050608] border border-[#1B2434] px-2.5 py-1.5 rounded-lg text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-500">Status:</span>
              <select
                aria-label="Filter Projects by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0B0F18]">All Statuses</option>
                <option value="active" className="bg-[#0B0F18]">Active</option>
                <option value="planned" className="bg-[#0B0F18]">Planned</option>
                <option value="on_hold" className="bg-[#0B0F18]">On Hold</option>
                <option value="completed" className="bg-[#0B0F18]">Completed</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#050608] border border-[#1B2434] px-2.5 py-1.5 rounded-lg text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-500">Sort:</span>
              <select
                aria-label="Sort Projects By"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "deadline" | "name" | "budget" | "created"
                  )
                }
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="deadline" className="bg-[#0B0F18]">Nearest Deadline</option>
                <option value="name" className="bg-[#0B0F18]">Project Name</option>
                <option value="budget" className="bg-[#0B0F18]">Highest Budget</option>
                <option value="created" className="bg-[#0B0F18]">Recently Created</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Listing */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading project repository...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
            <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No matching projects found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search criteria or filter options."
                : "Initialize your first project to begin delegating tasks and tracking milestones."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const metrics = metricsMap[p.id] || {
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                totalExpenses: 0,
                budgetRemaining: p.budget,
                budgetUtilization: 0,
              };
              const members = membersMap[p.id] || [];

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] hover:border-[#142B52] transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <ProjectStatusBadge status={p.status} />
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Deadline: {formatDate(p.deadline)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        {metrics.completedTasks}/{metrics.totalTasks} Tasks
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-300 font-medium">
                          {metrics.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-[#101725] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${metrics.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget & Utilization */}
                    <div className="p-2.5 rounded-lg bg-[#080B12] border border-[#1B2434] flex items-center justify-between text-[11px]">
                      <div>
                        <p className="text-slate-500">Budget Cap</p>
                        <p className="font-semibold text-slate-200">
                          {formatCurrencyINR(p.budget)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Utilization</p>
                        <p
                          className={`font-semibold ${
                            metrics.budgetUtilization > 100 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {metrics.budgetUtilization}% ({formatCurrencyINR(metrics.totalExpenses)})
                        </p>
                      </div>
                    </div>

                    {/* Team Members Avatars */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center -space-x-1.5">
                        {members.slice(0, 4).map((m, idx) => (
                          <div
                            key={m.uid || idx}
                            title={`${m.displayName} (${m.role})`}
                            className="w-6 h-6 rounded-full bg-[#142B52] border border-[#080B12] text-[10px] font-bold text-blue-200 flex items-center justify-center cursor-default"
                          >
                            {m.displayName.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {members.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-[#101725] border border-[#080B12] text-[10px] text-slate-400 flex items-center justify-center">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-[#1B2434] mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Owner: {p.ownerName}
                    </span>
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      Workspace <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
