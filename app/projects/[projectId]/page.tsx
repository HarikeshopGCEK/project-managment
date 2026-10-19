"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { ProjectNav } from "@/src/components/project-nav";
import {
  getProjectById,
  getUserProjectRole,
  calculateProjectMetrics,
  getProjectMembers,
  getProjectActivities,
  type ProjectMetrics,
} from "@/src/lib/data-service";
import { formatCurrencyINR, formatDate } from "@/src/lib/utils";
import { ProjectStatusBadge, RoleBadge } from "@/src/components/ui/badges";
import type { Project, ProjectMember, ActivityLog, UserRole } from "@/src/types";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Target,
  Users,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

function ProjectOverviewContent() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { user } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!projectId || !user) return;
      try {
        setLoading(true);
        const [proj, role, met, mems, acts] = await Promise.all([
          getProjectById(projectId),
          getUserProjectRole(projectId, user.uid),
          calculateProjectMetrics(projectId),
          getProjectMembers(projectId),
          getProjectActivities(projectId, 10),
        ]);

        if (!proj) {
          router.replace("/projects");
          return;
        }

        setProject(proj);
        setUserRole(role);
        setMetrics(met);
        setMembers(mems);
        setActivities(acts);
      } catch (err) {
        console.error("Error loading project overview:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, user, router]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">
          Loading engineering project workspace...
        </div>
      </AppLayout>
    );
  }

  if (!project) return null;

  const isManagerOrOwner = userRole === "owner" || userRole === "manager";

  return (
    <AppLayout>
      <div className="space-y-6">
        <ProjectNav
          projectId={project.id}
          projectName={project.name}
          userRole={userRole}
        />

        {/* Top Info Bar */}
        <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-slate-400">
                  Created {formatDate(project.createdAt)} by {project.ownerName}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl pt-1">
                {project.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isManagerOrOwner && (
                <Link
                  href={`/projects/${project.id}/tasks?new=true`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Task</span>
                </Link>
              )}
              <Link
                href="/reports"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] rounded-lg transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Reports</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1B2434] text-xs">
            <div>
              <span className="text-[11px] text-slate-500">Timeline Start</span>
              <p className="font-medium text-slate-200 mt-0.5">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Target Deadline</span>
              <p className="font-medium text-slate-200 mt-0.5">{formatDate(project.deadline)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Allocated Budget</span>
              <p className="font-medium text-slate-200 mt-0.5">{formatCurrencyINR(project.budget)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Active Roster</span>
              <p className="font-medium text-slate-200 mt-0.5">{members.length} Assigned Engineers</p>
            </div>
          </div>
        </div>

        {/* KPI Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Task Progress</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{metrics.completionRate}%</span>
                <span className="text-xs text-slate-500">
                  ({metrics.completedTasks}/{metrics.totalTasks})
                </span>
              </div>
              <div className="w-full bg-[#101725] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Overdue Deliverables</span>
                <AlertTriangle
                  className={`w-4 h-4 ${
                    metrics.overdueTasks > 0 ? "text-rose-400" : "text-slate-500"
                  }`}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${
                    metrics.overdueTasks > 0 ? "text-rose-400" : "text-slate-100"
                  }`}
                >
                  {metrics.overdueTasks}
                </span>
                <span className="text-xs text-slate-500">bottlenecks</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {metrics.inProgressTasks} in progress, {metrics.blockedTasks} blocked
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Expenses</span>
                <IndianRupee className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {formatCurrencyINR(metrics.totalExpenses)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Utilization: {metrics.budgetUtilization}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Budget Remaining</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${
                    metrics.budgetRemaining < 0 ? "text-rose-400" : "text-slate-100"
                  }`}
                >
                  {formatCurrencyINR(metrics.budgetRemaining)}
                </span>
              </div>
              <p
                className={`text-[11px] mt-2 ${
                  metrics.isOverBudget ? "text-rose-400 font-medium" : "text-slate-500"
                }`}
              >
                {metrics.isOverBudget ? "Budget overrun warning!" : "Within allocated funds"}
              </p>
            </div>
          </div>
        )}

        {/* Two Columns: Objectives + Team Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objectives Card */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-[#1B2434] pb-3">
              <Target className="w-4 h-4 text-blue-400" />
              Project Deliverables & Objectives
            </h3>
            <div className="space-y-2">
              {project.objectives?.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#080B12] border border-[#1B2434] text-xs text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Roster Card */}
          <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B2434] pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Team Roster & Delegated Roles
              </h3>
              <Link
                href={`/projects/${project.id}/team`}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                Manage Team <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#080B12] border border-[#1B2434] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#142B52] border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{m.displayName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                    </div>
                  </div>
                  <RoleBadge role={m.role} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1B2434] pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Project Audit & Activity Log
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Immutable audit trail</span>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No logged activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-300">{act.summary}</p>
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
    </AppLayout>
  );
}

export default function ProjectOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-12 text-center text-xs text-slate-500">
          Loading project deliverable workspace...
        </div>
      }
    >
      <ProjectOverviewContent />
    </Suspense>
  );
}
