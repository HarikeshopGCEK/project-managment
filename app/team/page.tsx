"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import {
  getProjects,
  getProjectMembers,
  getTasksByProject,
} from "@/src/lib/data-service";
import { RoleBadge } from "@/src/components/ui/badges";
import type { UserRole } from "@/src/types";
import { Users, Mail } from "lucide-react";

interface TeamMemberAggregate {
  uid: string;
  displayName: string;
  email: string;
  projects: { id: string; name: string; role: UserRole }[];
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export default function TeamWorkloadPage() {
  const { user } = useAuth();
  const [aggregates, setAggregates] = useState<TeamMemberAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      if (!user) return;
      try {
        setLoading(true);
        const projects = await getProjects(user.uid);

        const memberMap = new Map<string, TeamMemberAggregate>();
        const todayStr = new Date().toISOString().split("T")[0];

        for (const proj of projects) {
          const [mems, tasks] = await Promise.all([
            getProjectMembers(proj.id),
            getTasksByProject(proj.id),
          ]);

          for (const m of mems) {
            let record = memberMap.get(m.uid);
            if (!record) {
              record = {
                uid: m.uid,
                displayName: m.displayName,
                email: m.email,
                projects: [],
                totalAssigned: 0,
                completed: 0,
                inProgress: 0,
                overdue: 0,
              };
              memberMap.set(m.uid, record);
            }

            record.projects.push({
              id: proj.id,
              name: proj.name,
              role: m.role,
            });

            // Count tasks for this user in this project
            const userTasks = tasks.filter((t) => t.assigneeId === m.uid);
            record.totalAssigned += userTasks.length;
            record.completed += userTasks.filter((t) => t.status === "completed").length;
            record.inProgress += userTasks.filter((t) => t.status === "in_progress").length;
            record.overdue += userTasks.filter(
              (t) => t.status !== "completed" && t.dueDate && t.dueDate < todayStr
            ).length;
          }
        }

        setAggregates(Array.from(memberMap.values()));
      } catch (err) {
        console.error("Error loading team aggregates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [user]);

  const totalEngineers = aggregates.length;
  const totalDelegatedTasks = aggregates.reduce((sum, a) => sum + a.totalAssigned, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-400" />
              Human Resource Delegation & Team Workload
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cross-project engineer capacity monitoring and workload balance (KTU PBMET504 Management for Engineers)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] text-xs">
              <span className="text-slate-500">Active Personnel: </span>
              <span className="font-bold text-slate-200">{totalEngineers} Engineers</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F18] border border-[#1B2434] text-xs">
              <span className="text-slate-500">Delegated Tasks: </span>
              <span className="font-bold text-slate-200">{totalDelegatedTasks} Tasks</span>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Analyzing engineering workforce distribution...
          </div>
        ) : aggregates.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No team data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {aggregates.map((member) => {
              const completionRate =
                member.totalAssigned > 0
                  ? Math.round((member.completed / member.totalAssigned) * 100)
                  : 0;

              return (
                <div
                  key={member.uid}
                  className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] hover:border-[#142B52] transition-all space-y-4 shadow-lg text-xs"
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#142B52] border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          {member.displayName}
                          {member.uid === user?.uid && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30 font-normal">
                              You
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-600" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workload Breakdown Badges */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-[#080B12] border border-[#1B2434]">
                      <span className="text-[10px] text-slate-500 block">Total</span>
                      <span className="font-bold text-slate-200 mt-0.5 block">
                        {member.totalAssigned}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080B12] border border-[#1B2434]">
                      <span className="text-[10px] text-emerald-500 block">Done</span>
                      <span className="font-bold text-emerald-400 mt-0.5 block">
                        {member.completed}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080B12] border border-[#1B2434]">
                      <span className="text-[10px] text-blue-500 block">Active</span>
                      <span className="font-bold text-blue-400 mt-0.5 block">
                        {member.inProgress}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080B12] border border-[#1B2434]">
                      <span className="text-[10px] text-rose-500 block">Overdue</span>
                      <span
                        className={`font-bold mt-0.5 block ${
                          member.overdue > 0 ? "text-rose-400" : "text-slate-500"
                        }`}
                      >
                        {member.overdue}
                      </span>
                    </div>
                  </div>

                  {/* Completion Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Deliverable Completion</span>
                      <span className="text-slate-300 font-medium">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-[#101725] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Projects Participated */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1B2434]">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Assigned Project Roster
                    </span>
                    <div className="space-y-1">
                      {member.projects.map((proj) => (
                        <div
                          key={proj.id}
                          className="flex items-center justify-between p-1.5 rounded bg-[#080B12] text-[11px]"
                        >
                          <Link
                            href={`/projects/${proj.id}`}
                            className="text-slate-300 hover:text-blue-400 truncate max-w-[200px]"
                          >
                            {proj.name}
                          </Link>
                          <RoleBadge role={proj.role} />
                        </div>
                      ))}
                    </div>
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
