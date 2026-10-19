"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import {
  getProjects,
  getUserTasks,
  getAllRecentActivities,
  calculateProjectMetrics,
  type ProjectMetrics,
} from "@/src/lib/data-service";
import { formatCurrencyINR, formatDate } from "@/src/lib/utils";
import { ProjectStatusBadge, PriorityBadge, TaskStatusBadge } from "@/src/components/ui/badges";
import type { Project, Task, ActivityLog } from "@/src/types";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Plus,
  Calendar,
  Activity,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [projectMetricsMap, setProjectMetricsMap] = useState<Record<string, ProjectMetrics>>({});
  const [todayStr, setTodayStr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      setTodayStr(new Date().toISOString().split("T")[0]);
      try {
        setLoading(true);
        const [userProjects, userTasks, activities] = await Promise.all([
          getProjects(user.uid),
          getUserTasks(user.uid),
          getAllRecentActivities(8, user.uid),
        ]);

        setProjects(userProjects);
        setTasks(userTasks);
        setRecentActivities(activities);

        // Fetch metrics for all user projects
        const metricsMap: Record<string, ProjectMetrics> = {};
        for (const p of userProjects) {
          metricsMap[p.id] = await calculateProjectMetrics(p.id);
        }
        setProjectMetricsMap(metricsMap);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // Aggregate KPI metrics
  const activeProjects = projects.filter((p) => p.status === "active");
  const ownedProjects = projects.filter((p) => p.ownerId === user?.uid);
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && todayStr && t.dueDate < todayStr
  );

  const totalAssignedTasks = tasks.length;
  const overallTaskCompletion =
    totalAssignedTasks > 0 ? Math.round((completedTasks.length / totalAssignedTasks) * 100) : 0;

  // Aggregate budget
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = Object.values(projectMetricsMap).reduce(
    (acc, m) => acc + (m.totalExpenses || 0),
    0
  );
  const overallBudgetRemaining = totalBudget - totalSpent;
  const overallBudgetUtilization =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Welcome & KPI Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PBMET504 Management Console
              </span>
              <span className="text-xs text-slate-500">2024 Scheme</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1.5">
              Welcome back, {user?.displayName || "Engineer"}
            </h1>
            <p className="text-xs text-slate-400">
              Monitoring active engineering projects, schedule milestones, and financial allocations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#0B0F18] hover:bg-[#101725] border border-[#1B2434] rounded-lg transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>View Analytics</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Projects */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Workspaces</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{activeProjects.length}</span>
              <span className="text-xs text-slate-500">of {projects.length} total</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {ownedProjects.length} owned by your account
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-transparent" />
          </div>

          {/* Card 2: Tasks & Progress */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Task Completion</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{overallTaskCompletion}%</span>
              <span className="text-xs text-slate-500">
                ({completedTasks.length}/{totalAssignedTasks} tasks)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#101725] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallTaskCompletion}%` }}
              />
            </div>
          </div>

          {/* Card 3: Overdue & Deadlines */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Schedule Health</span>
              <div
                className={`p-2 rounded-lg border ${
                  overdueTasks.length > 0
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                {overdueTasks.length > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  overdueTasks.length > 0 ? "text-rose-400" : "text-slate-100"
                }`}
              >
                {overdueTasks.length}
              </span>
              <span className="text-xs text-slate-500">overdue assignments</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {overdueTasks.length > 0 ? "Requires schedule intervention" : "All deliverables on schedule"}
            </p>
          </div>

          {/* Card 4: Budget Allocated & Spent */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Budget (INR)</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {formatCurrencyINR(totalSpent)}
              </span>
              <span className="text-xs text-slate-500">spent</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {overallBudgetUtilization}% utilized • {formatCurrencyINR(overallBudgetRemaining)} remaining
            </p>
          </div>
        </div>

        {/* Projects Overview Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              Active Engineering Projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              View all ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading project data...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
              <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No Projects Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by creating your first engineering capstone or research project.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((p) => {
                const metrics = projectMetricsMap[p.id] || {
                  totalTasks: 0,
                  completedTasks: 0,
                  completionRate: 0,
                  totalExpenses: 0,
                  budgetRemaining: p.budget,
                  budgetUtilization: 0,
                };

                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] hover:border-[#142B52] transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
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

                      {/* Milestone & Deadline */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Due: {formatDate(p.deadline)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          {metrics.completedTasks}/{metrics.totalTasks} Done
                        </span>
                      </div>

                      {/* Task Completion Bar */}
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

                      {/* Budget summary */}
                      <div className="p-2.5 rounded-lg bg-[#080B12] border border-[#1B2434] flex items-center justify-between text-[11px]">
                        <div>
                          <p className="text-slate-500">Budget Allocated</p>
                          <p className="font-medium text-slate-200">{formatCurrencyINR(p.budget)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500">Utilization</p>
                          <p
                            className={`font-medium ${
                              metrics.budgetUtilization > 100 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {metrics.budgetUtilization}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1B2434] mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Lead: {p.ownerName || "Engineering Lead"}
                      </span>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-[11px]"
                      >
                        Manage <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-Column Section: My Assigned Tasks & Recent Collaboration Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Tasks Card */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B2434] pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Your Assigned Tasks
              </h3>
              <Link
                href="/my-tasks"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                View all ({tasks.length})
              </Link>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active tasks assigned to your account.
              </p>
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="truncate">{t.projectName}</span>
                        <span>•</span>
                        <span>Due {formatDate(t.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={t.priority} />
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed Card */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B2434] pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Recent Engineering Operations Activity
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Real-time log</span>
            </div>

            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No recorded activity logs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 6).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-slate-300 text-xs leading-relaxed">{act.summary}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{act.actorName}</span>
                        <span>•</span>
                        <span>{formatDate(act.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Academic Syllabus Quick Card */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-[#0B1528] to-[#0B0F18] border border-[#142B52] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">
                PBMET504 Management Decision Tools
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Execute forward & backward pass calculations for the Critical Path Method (CPM), analyze
              activity slack/float, or evaluate Expected Monetary Value (EMV) decision payoff matrices.
            </p>
          </div>
          <Link
            href="/academic"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors shrink-0"
          >
            Launch Decision Tools
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
