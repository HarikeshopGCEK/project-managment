"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { getUserTasks, updateTask } from "@/src/lib/data-service";
import { formatDate } from "@/src/lib/utils";
import { PriorityBadge, TaskStatusBadge } from "@/src/components/ui/badges";
import type { Task, TaskStatus } from "@/src/types";
import {
  CheckSquare,
  AlertTriangle,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Filter,
  ArrowRight,
} from "lucide-react";

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    async function loadTasks() {
      if (!user) return;
      setTodayStr(new Date().toISOString().split("T")[0]);
      try {
        setLoading(true);
        const userTaskList = await getUserTasks(user.uid);
        setTasks(userTaskList);
      } catch (err) {
        console.error("Error loading user tasks:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [user]);

  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    if (!user) return;
    try {
      await updateTask(task.projectId, task.id, { status: newStatus }, user);
      setTasks(
        tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update task status.");
    }
  };

  const filteredTasks = tasks.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && t.dueDate < todayStr
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <CheckSquare className="w-6 h-6 text-blue-400" />
              My Assigned Deliverables
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Personal engineering assignments delegated across all authorized projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F18] border border-[#1B2434] text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Completed:</span>
              <span className="font-bold text-slate-200">
                {completedCount}/{tasks.length}
              </span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="font-bold">{overdueCount} Overdue</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-medium">Filter by Status:</span>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "todo", "in_progress", "blocked", "completed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors capitalize ${
                    statusFilter === st
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-[#050608] border border-[#1B2434] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading your deliverables...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No matching assignments</p>
            <p className="text-xs text-slate-500">
              You currently have no tasks matching this filter status.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((t) => {
              const isOverdue =
                t.status !== "completed" && t.dueDate && t.dueDate < todayStr;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] hover:border-[#142B52] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={t.priority} />
                      <TaskStatusBadge status={t.status} />
                      <Link
                        href={`/projects/${t.projectId}`}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <FolderKanban className="w-3 h-3" />
                        {t.projectName || "View Project"}
                      </Link>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100">{t.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due {formatDate(t.dueDate)}
                      </span>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                      <span>Duration: {t.estimatedDurationDays} Days</span>
                    </div>
                  </div>

                  {/* Quick Status Action Controls */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#1B2434] pt-3 md:pt-0 md:pl-4">
                    <span className="text-[11px] text-slate-500 hidden lg:inline">Update:</span>
                    <select
                      aria-label="Update Task Status"
                      value={t.status}
                      onChange={(e) => handleStatusUpdate(t, e.target.value as TaskStatus)}
                      className="bg-[#050608] border border-[#1B2434] text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Link
                      href={`/projects/${t.projectId}/tasks`}
                      className="p-1.5 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] text-slate-300 rounded-lg transition-colors"
                      title="View in Project Workspace"
                    >
                      <ArrowRight className="w-4 h-4" />
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
