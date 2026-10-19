"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Users, Settings } from "lucide-react";
import { RoleBadge } from "./ui/badges";
import type { UserRole } from "@/src/types";

export function ProjectNav({
  projectId,
  projectName,
  userRole,
}: {
  projectId: string;
  projectName: string;
  userRole?: UserRole | null;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: `/projects/${projectId}`, icon: LayoutDashboard },
    { label: "Tasks & Deliverables", href: `/projects/${projectId}/tasks`, icon: CheckSquare },
    { label: "Team & Roles", href: `/projects/${projectId}/team`, icon: Users },
    { label: "Project Settings", href: `/projects/${projectId}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight truncate">
            {projectName}
          </h1>
          {userRole && <RoleBadge role={userRole} />}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-[#1B2434] overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "border-blue-500 text-blue-400 bg-[#0B0F18]/50"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
