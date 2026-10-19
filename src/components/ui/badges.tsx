import React from "react";
import type { UserRole, ProjectStatus, TaskPriority, TaskStatus } from "@/src/types";

export function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case "owner":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Owner
        </span>
      );
    case "manager":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Manager
        </span>
      );
    case "member":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Member
        </span>
      );
    case "viewer":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Viewer
        </span>
      );
  }
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
          Active
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
          Completed
        </span>
      );
    case "on_hold":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          On Hold
        </span>
      );
    case "planned":
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Planned
        </span>
      );
  }
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  switch (priority) {
    case "critical":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
          Critical
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25">
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
          Medium
        </span>
      );
    case "low":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/25">
          Low
        </span>
      );
  }
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Completed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          In Progress
        </span>
      );
    case "blocked":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Blocked
        </span>
      );
    case "todo":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          To Do
        </span>
      );
  }
}
