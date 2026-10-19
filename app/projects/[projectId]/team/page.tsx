"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { ProjectNav } from "@/src/components/project-nav";
import {
  getProjectById,
  getUserProjectRole,
  getProjectMembers,
  getTasksByProject,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from "@/src/lib/data-service";
import { RoleBadge } from "@/src/components/ui/badges";
import type { Project, ProjectMember, Task, UserRole } from "@/src/types";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  X,
  AlertCircle,
} from "lucide-react";

function ProjectTeamContent() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState("");

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTeamData() {
      if (!projectId || !user) return;
      setTodayStr(new Date().toISOString().split("T")[0]);
      try {
        setLoading(true);
        const [proj, role, mems, taskList] = await Promise.all([
          getProjectById(projectId),
          getUserProjectRole(projectId, user.uid),
          getProjectMembers(projectId),
          getTasksByProject(projectId),
        ]);

        setProject(proj);
        setUserRole(role);
        setMembers(mems);
        setTasks(taskList);
      } catch (err) {
        console.error("Error loading team data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [projectId, user]);

  const isOwner = userRole === "owner";
  const isManagerOrOwner = userRole === "owner" || userRole === "manager";

  // Workload calculations per member
  const getMemberWorkload = (uid: string) => {
    const assigned = tasks.filter((t) => t.assigneeId === uid);
    const completed = assigned.filter((t) => t.status === "completed").length;
    const inProgress = assigned.filter((t) => t.status === "in_progress").length;
    const overdue = assigned.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < todayStr
    ).length;

    return {
      total: assigned.length,
      completed,
      inProgress,
      overdue,
    };
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setModalError(null);
    setSubmitting(true);

    try {
      const added = await addProjectMember(projectId, newEmail.trim(), newRole, user);
      setMembers([...members, added]);
      setShowAddModal(false);
      setNewEmail("");
      setNewRole("member");
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to add team member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (member: ProjectMember, targetRole: UserRole) => {
    if (!user) return;
    if (!isOwner) {
      alert("Only the Project Owner can update member roles.");
      return;
    }
    if (member.uid === user.uid) {
      alert("You cannot change your own role as Project Owner directly.");
      return;
    }

    try {
      await updateProjectMemberRole(projectId, member.uid, member.displayName, targetRole, user);
      setMembers(
        members.map((m) => (m.uid === member.uid ? { ...m, role: targetRole } : m))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!user) return;
    if (!isOwner && member.uid !== user.uid) {
      alert("Only the Project Owner can remove other members.");
      return;
    }
    if (member.role === "owner") {
      alert("The Project Owner cannot be removed. Transfer ownership first in Settings.");
      return;
    }

    if (
      !confirm(
        `Remove ${member.displayName} (${member.email}) from this project? Any tasks assigned to them will be unassigned.`
      )
    )
      return;

    try {
      await removeProjectMember(projectId, member.uid, member.displayName, user);
      setMembers(members.filter((m) => m.uid !== member.uid));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">Loading team roster...</div>
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Human Resource Delegation & Roles
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage member authority levels and balance engineering workloads (KTU PBMET504 HRM Module)
            </p>
          </div>

          {isManagerOrOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member by Email</span>
            </button>
          )}
        </div>

        {/* Members & Workload Table */}
        <div className="rounded-xl bg-[#0B0F18] border border-[#1B2434] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080B12] border-b border-[#1B2434] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Engineer / Academic Member</th>
                  <th className="py-3 px-4">Project Role</th>
                  <th className="py-3 px-4 text-center">Assigned Tasks</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">In Progress</th>
                  <th className="py-3 px-4 text-center">Overdue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2434]">
                {members.map((member) => {
                  const workload = getMemberWorkload(member.uid);
                  const isCurrent = member.uid === user?.uid;

                  return (
                    <tr key={member.uid} className="hover:bg-[#101725]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#142B52] border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">
                                {member.displayName}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-600" />
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isOwner && !isCurrent ? (
                          <select
                            aria-label={`Change role for ${member.displayName}`}
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member, e.target.value as UserRole)
                            }
                            className="bg-[#050608] border border-[#1B2434] text-slate-200 px-2 py-1 rounded text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="owner" className="bg-[#0B0F18]">Owner</option>
                            <option value="manager" className="bg-[#0B0F18]">Manager</option>
                            <option value="member" className="bg-[#0B0F18]">Member</option>
                            <option value="viewer" className="bg-[#0B0F18]">Viewer</option>
                          </select>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-200">
                        {workload.total}
                      </td>

                      <td className="py-3 px-4 text-center text-emerald-400 font-medium">
                        {workload.completed}
                      </td>

                      <td className="py-3 px-4 text-center text-blue-400 font-medium">
                        {workload.inProgress}
                      </td>

                      <td className="py-3 px-4 text-center font-medium">
                        <span
                          className={
                            workload.overdue > 0 ? "text-rose-400 font-bold" : "text-slate-500"
                          }
                        >
                          {workload.overdue}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isOwner && member.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Matrix Explainer (Academic Context) */}
        <div className="p-5 rounded-xl bg-[#080B12] border border-[#1B2434] space-y-3">
          <h3 className="font-semibold text-xs text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Role Hierarchy & Security Boundaries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] space-y-1">
              <span className="font-semibold text-amber-400">Owner</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Full authority. Can manage settings, transfer ownership, assign managers, modify
                budgets, and delete the project.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] space-y-1">
              <span className="font-semibold text-blue-400">Manager</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Operations lead. Can create/assign tasks, track progress, log expenses, and review
                workloads. Cannot delete project.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] space-y-1">
              <span className="font-semibold text-emerald-400">Member</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Engineering contributor. Can update status and notes on their assigned deliverables,
                and post comments.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] space-y-1">
              <span className="font-semibold text-slate-400">Viewer</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Academic guide / auditor. Read-only access to deliverables, timelines, financial
                budgets, and analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 text-xs">
            <div className="relative w-full max-w-md bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  Add Team Member to Project
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="m-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Registered Email Address <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. anjali.menon@ktu.edu.in"
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    In demo mode, try: anjali.menon@ktu.edu.in, siddharth.rao@ktu.edu.in, or dr.thomas@ktu.edu.in
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Assign Project Role</label>
                  <select
                    aria-label="Assign Project Role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="manager">Manager (Manage tasks, expenses, workloads)</option>
                    <option value="member">Member (Work on assigned deliverables)</option>
                    <option value="viewer">Viewer (Read-only auditor/faculty advisor)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-[#1B2434] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-[#101725] text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
                  >
                    {submitting ? "Adding..." : "Add to Roster"}
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

export default function ProjectTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-12 text-center text-xs text-slate-500">
          Loading project personnel roster...
        </div>
      }
    >
      <ProjectTeamContent />
    </Suspense>
  );
}
