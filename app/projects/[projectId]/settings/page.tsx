"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { ProjectNav } from "@/src/components/project-nav";
import {
  getProjectById,
  getUserProjectRole,
  updateProject,
  deleteProject,
  getProjectMembers,
  updateProjectMemberRole,
} from "@/src/lib/data-service";
import type { Project, ProjectMember, ProjectStatus, UserRole } from "@/src/types";
import {
  Settings,
  Trash2,
  Save,
  UserCheck,
  ShieldAlert,
  Calendar,
  IndianRupee,
  Layers,
  CheckCircle2,
} from "lucide-react";

function ProjectSettingsContent() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { user } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("0");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Transfer Ownership
  const [transferTargetUid, setTransferTargetUid] = useState("");

  // Deletion Confirmation
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!projectId || !user) return;
      try {
        setLoading(true);
        const [proj, role, mems] = await Promise.all([
          getProjectById(projectId),
          getUserProjectRole(projectId, user.uid),
          getProjectMembers(projectId),
        ]);

        if (!proj) {
          router.replace("/projects");
          return;
        }

        setProject(proj);
        setUserRole(role);
        setMembers(mems);

        setName(proj.name);
        setDescription(proj.description);
        setStartDate(proj.startDate);
        setDeadline(proj.deadline);
        setBudget(String(proj.budget || 0));
        setStatus(proj.status);
      } catch (err) {
        console.error("Error loading project settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, user, router]);

  const isOwner = userRole === "owner";
  const isManagerOrOwner = userRole === "owner" || userRole === "manager";

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    if (!isManagerOrOwner) {
      alert("Permission denied. Only Owner or Manager can edit project information.");
      return;
    }

    try {
      await updateProject(
        projectId,
        {
          name: name.trim(),
          description: description.trim(),
          startDate,
          deadline,
          budget: Number(budget) || 0,
          status,
        },
        user
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update project settings.");
    }
  };

  const handleTransferOwnership = async () => {
    if (!user || !project) return;
    if (!isOwner) {
      alert("Only the current Project Owner can transfer ownership.");
      return;
    }
    const targetMember = members.find((m) => m.uid === transferTargetUid);
    if (!targetMember) {
      alert("Please select an existing project member to receive ownership.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to transfer Project Ownership to ${targetMember.displayName}? You will become a Manager.`
      )
    )
      return;

    try {
      // 1. Promote target to owner
      await updateProjectMemberRole(
        projectId,
        targetMember.uid,
        targetMember.displayName,
        "owner",
        user
      );
      // 2. Demote current user to manager
      await updateProjectMemberRole(
        projectId,
        user.uid,
        user.displayName,
        "manager",
        user
      );
      // 3. Update project doc ownerId
      await updateProject(
        projectId,
        {
          ownerId: targetMember.uid,
          ownerName: targetMember.displayName,
          ownerEmail: targetMember.email,
        },
        user
      );

      alert(`Ownership successfully transferred to ${targetMember.displayName}.`);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to transfer ownership.");
    }
  };

  const handleDeleteProject = async () => {
    if (!user || !project) return;
    if (!isOwner) {
      alert("Only the Project Owner has permission to delete this project.");
      return;
    }
    if (deleteConfirmationText.trim() !== project.name.trim()) {
      alert(`Please type the exact project title "${project.name}" to confirm deletion.`);
      return;
    }

    setDeleting(true);
    try {
      await deleteProject(projectId, user);
      router.push("/projects");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete project.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">Loading project settings...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <ProjectNav
          projectId={projectId}
          projectName={project?.name || "Project"}
          userRole={userRole}
        />

        {/* Section 1: Edit Project Metadata */}
        <div className="p-6 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-5 shadow-lg text-xs">
          <div className="border-b border-[#1B2434] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Project Specifications & Status
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Update operational parameters, timeline dates, and allocated budget
              </p>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveMetadata} className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Project Title</label>
              <input
                type="text"
                required
                disabled={!isManagerOrOwner}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Description & Engineering Scope</label>
              <textarea
                rows={3}
                required
                disabled={!isManagerOrOwner}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Start Date
                </label>
                <input
                  type="date"
                  required
                  disabled={!isManagerOrOwner}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Deadline
                </label>
                <input
                  type="date"
                  required
                  disabled={!isManagerOrOwner}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500" /> Allocated Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  disabled={!isManagerOrOwner}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Project Execution Status
              </label>
              <select
                aria-label="Project Execution Status"
                disabled={!isManagerOrOwner}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="active">Active (Under Execution)</option>
                <option value="planned">Planned (Charter & Initiation)</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed (Evaluation & Handoff)</option>
              </select>
            </div>

            {isManagerOrOwner && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Save Specifications
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Section 2: Ownership Transfer */}
        {isOwner && (
          <div className="p-6 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4 shadow-lg text-xs">
            <div className="border-b border-[#1B2434] pb-3">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Transfer Project Ownership
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Relinquish Owner privileges and designate another team member as the Project Owner
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <select
                aria-label="Select Project Member for Ownership Transfer"
                value={transferTargetUid}
                onChange={(e) => setTransferTargetUid(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Select project member...</option>
                {members
                  .filter((m) => m.uid !== user?.uid)
                  .map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName} ({m.email}) — current: {m.role}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleTransferOwnership}
                disabled={!transferTargetUid}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shrink-0"
              >
                Transfer Ownership
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Danger Zone (Cascade Project Deletion) */}
        {isOwner && (
          <div className="p-6 rounded-xl bg-[#12080A] border border-rose-900/40 space-y-4 shadow-lg text-xs">
            <div className="border-b border-rose-900/30 pb-3">
              <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Danger Zone: Permanent Deletion
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Permanently delete this project along with all associated deliverables, tasks, comments,
                financial expenses, and audit logs. This cannot be undone.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-300">
                To confirm, type the exact project title <strong className="text-slate-100">&quot;{project?.name}&quot;</strong> below:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type exact project title here..."
                  className="flex-1 px-3 py-2 bg-[#050608] border border-rose-900/40 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deleting || deleteConfirmationText.trim() !== project?.name.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Deleting Workspace..." : "Delete Project Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ProjectSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-12 text-center text-xs text-slate-500">
          Loading project governance console...
        </div>
      }
    >
      <ProjectSettingsContent />
    </Suspense>
  );
}
