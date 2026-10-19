"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { ProjectNav } from "@/src/components/project-nav";
import {
  getProjectById,
  getUserProjectRole,
  getTasksByProject,
  getProjectMembers,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  addTaskComment,
} from "@/src/lib/data-service";
import { formatDate } from "@/src/lib/utils";
import { PriorityBadge, TaskStatusBadge } from "@/src/components/ui/badges";
import type {
  Project,
  Task,
  ProjectMember,
  TaskComment,
  UserRole,
  TaskPriority,
  TaskStatus,
} from "@/src/types";
import {
  CheckSquare,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  AlertTriangle,
  MessageSquare,
  Trash2,
  X,
  Send,
} from "lucide-react";

function TasksContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: Table vs Kanban
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Modals state
  const [showNewTaskModal, setShowNewTaskModal] = useState(
    searchParams.get("new") === "true"
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // New Task Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newStartDate, setNewStartDate] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDurationDays, setNewDurationDays] = useState("7");
  const [modalError, setModalError] = useState<string | null>(null);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!projectId || !user) return;
      const today = new Date().toISOString().split("T")[0];
      setTodayStr(today);
      setNewStartDate(today);
      try {
        setLoading(true);
        const [proj, role, taskList, mems] = await Promise.all([
          getProjectById(projectId),
          getUserProjectRole(projectId, user.uid),
          getTasksByProject(projectId),
          getProjectMembers(projectId),
        ]);

        setProject(proj);
        setUserRole(role);
        setTasks(taskList);
        setMembers(mems);
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, user]);

  // Open Task details & load comments
  const handleOpenTask = async (task: Task) => {
    setSelectedTask(task);
    try {
      const comms = await getTaskComments(projectId, task.id);
      setComments(comms);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask || !user) return;

    setCommentLoading(true);
    try {
      const comm = await addTaskComment(
        projectId,
        selectedTask.id,
        newCommentText.trim(),
        user
      );
      setComments([...comments, comm]);
      setNewCommentText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setCommentLoading(false);
    }
  };

  // Status update
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) return;
    try {
      await updateTask(projectId, taskId, { status: newStatus }, user);
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Permission denied to update task status.");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(projectId, taskId, user);
      setTasks(tasks.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Permission denied to delete task.");
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    setModalError(null);

    const assignee = members.find((m) => m.uid === newAssigneeId);

    try {
      const created = await createTask(
        projectId,
        {
          projectId,
          projectName: project.name,
          title: newTitle.trim(),
          description: newDescription.trim(),
          assigneeId: assignee ? assignee.uid : undefined,
          assigneeName: assignee ? assignee.displayName : undefined,
          assigneeEmail: assignee ? assignee.email : undefined,
          creatorId: user.uid,
          creatorName: user.displayName,
          priority: newPriority,
          status: "todo",
          startDate: newStartDate,
          dueDate: newDueDate,
          estimatedDurationDays: Number(newDurationDays) || 1,
        },
        user
      );

      setTasks([created, ...tasks]);
      setShowNewTaskModal(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  const isManagerOrOwner = userRole === "owner" || userRole === "manager";

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" ? !t.assigneeId : t.assigneeId === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <ProjectNav
          projectId={projectId}
          projectName={project?.name || "Project"}
          userRole={userRole}
        />

        {/* Toolbar: Search, Filters, View Toggle, Create Task */}
        <div className="p-4 rounded-xl bg-[#0B0F18] border border-[#1B2434] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables & task specs..."
              className="w-full pl-9 pr-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              aria-label="Filter tasks by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#050608] border border-[#1B2434] text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              aria-label="Filter tasks by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#050608] border border-[#1B2434] text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              aria-label="Filter tasks by assignee"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-[#050608] border border-[#1B2434] text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.displayName}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#050608] border border-[#1B2434] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "table" ? "bg-[#142B52] text-blue-300" : "text-slate-500 hover:text-slate-300"
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "kanban" ? "bg-[#142B52] text-blue-300" : "text-slate-500 hover:text-slate-300"
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>

            {/* Create Task Button */}
            {isManagerOrOwner && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shrink-0 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Task View: Table vs Kanban */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading task matrix...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No tasks match criteria</p>
            <p className="text-xs text-slate-500">
              Create a task or clear filters to view engineering assignments.
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="rounded-xl bg-[#0B0F18] border border-[#1B2434] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#080B12] border-b border-[#1B2434] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Deliverable / Task</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2434]">
                  {filteredTasks.map((t) => {
                    const isOverdue =
                      t.status !== "completed" && t.dueDate && t.dueDate < todayStr;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleOpenTask(t)}
                        className="hover:bg-[#101725]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <span title="Overdue deliverable">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              </span>
                            )}
                            <span className="group-hover:text-blue-400 transition-colors">
                              {t.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {t.description}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <TaskStatusBadge status={t.status} />
                        </td>
                        <td className="py-3 px-4">
                          {t.assigneeName ? (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-5 h-5 rounded-full bg-[#142B52] text-blue-300 flex items-center justify-center font-bold text-[9px]">
                                {t.assigneeName.charAt(0).toUpperCase()}
                              </span>
                              {t.assigneeName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              isOverdue ? "text-rose-400 font-semibold" : "text-slate-400"
                            }
                          >
                            {formatDate(t.dueDate)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTask(t);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:bg-[#142B52] rounded transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(["todo", "in_progress", "blocked", "completed"] as TaskStatus[]).map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              const colTitle =
                colStatus === "todo"
                  ? "To Do"
                  : colStatus === "in_progress"
                  ? "In Progress"
                  : colStatus === "blocked"
                  ? "Blocked"
                  : "Completed";

              return (
                <div
                  key={colStatus}
                  className="rounded-xl bg-[#080B12] border border-[#1B2434] p-3 flex flex-col min-h-[400px]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2434] mb-3">
                    <span className="font-semibold text-xs text-slate-300 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          colStatus === "completed"
                            ? "bg-emerald-400"
                            : colStatus === "in_progress"
                            ? "bg-blue-400"
                            : colStatus === "blocked"
                            ? "bg-rose-400"
                            : "bg-slate-400"
                        }`}
                      />
                      {colTitle}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#101725] text-slate-400 text-[10px] font-mono">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map((t) => {
                      const isOverdue =
                        t.status !== "completed" && t.dueDate && t.dueDate < todayStr;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleOpenTask(t)}
                          className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] hover:border-blue-500/40 transition-all cursor-pointer space-y-2 text-xs group shadow"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors line-clamp-2">
                              {t.title}
                            </p>
                            <PriorityBadge priority={t.priority} />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                              <span className={isOverdue ? "text-rose-400 font-semibold" : ""}>
                                Due {formatDate(t.dueDate)}
                              </span>
                            </span>
                            <span className="text-slate-500">
                              {t.assigneeName ? t.assigneeName.split(" ")[0] : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedTask.priority} />
                  <TaskStatusBadge status={selectedTask.status} />
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <h2 className="text-base font-bold text-slate-100">{selectedTask.title}</h2>
                  <p className="text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[#080B12] border border-[#1B2434]">
                  <div>
                    <span className="text-[10px] text-slate-500">Assignee</span>
                    <p className="font-medium text-slate-200 mt-0.5">
                      {selectedTask.assigneeName || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Start Date</span>
                    <p className="font-medium text-slate-200 mt-0.5">
                      {formatDate(selectedTask.startDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Due Date</span>
                    <p className="font-medium text-slate-200 mt-0.5">
                      {formatDate(selectedTask.dueDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Duration</span>
                    <p className="font-medium text-slate-200 mt-0.5">
                      {selectedTask.estimatedDurationDays} Days
                    </p>
                  </div>
                </div>

                {/* Status Update Control */}
                {userRole !== "viewer" && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#101725] border border-[#1B2434]">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Update Task Status:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {(["todo", "in_progress", "blocked", "completed"] as TaskStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(selectedTask.id, st)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedTask.status === st
                                ? "bg-blue-600 text-white"
                                : "bg-[#080B12] text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {st === "todo"
                              ? "To Do"
                              : st === "in_progress"
                              ? "In Progress"
                              : st === "blocked"
                              ? "Blocked"
                              : "Completed"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Comments Thread */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-slate-200 flex items-center gap-2 border-b border-[#1B2434] pb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    Collaboration Comments ({comments.length})
                  </h3>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2">
                        No comments posted yet. Start the engineering discussion below.
                      </p>
                    ) : (
                      comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-2.5 rounded-lg bg-[#080B12] border border-[#1B2434] space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-blue-300">
                              {comm.authorName}
                            </span>
                            <span className="text-slate-500">{formatDate(comm.createdAt)}</span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{comm.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {userRole !== "viewer" && (
                    <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        required
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Type engineering feedback, test findings, or status updates..."
                        className="flex-1 px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={commentLoading}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Post
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                {isManagerOrOwner ? (
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Task
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] text-slate-300 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Task Modal */}
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs">
              <div className="px-6 py-4 border-b border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  Assign New Project Deliverable
                </h3>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="m-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Task Title <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Integrate LiDAR Telemetry over ROS2"
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Specifications / Description</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Hardware pinouts, libraries, test criteria..."
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Assign To</label>
                    <select
                      aria-label="Assign Task To Member"
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.displayName} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Priority Level</label>
                    <select
                      aria-label="Task Priority Level"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Start Date</label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                      Due Date <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Est. Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={newDurationDays}
                      onChange={(e) => setNewDurationDays(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1B2434] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-2 bg-[#101725] text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
                  >
                    Assign Task
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

export default function ProjectTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-12 text-center text-xs text-slate-500">
          Loading project deliverable workspace...
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}

