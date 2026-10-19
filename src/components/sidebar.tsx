"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  IndianRupee,
  BarChart3,
  Cpu,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "My Tasks", href: "/my-tasks", icon: CheckSquare },
  { label: "Team Workload", href: "/team", icon: Users },
  { label: "Expenses & Budget", href: "/expenses", icon: IndianRupee },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Academic Tools (CPM/EMV)", href: "/academic", icon: Cpu },
  { label: "User Profile", href: "/profile", icon: UserCircle },
];

export function Sidebar({
  isMobileOpen,
  onCloseMobile,
}: {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#080B12] border-r border-[#1B2434] transition-all duration-300 ease-in-out
          ${collapsed ? "w-18" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1B2434]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={onCloseMobile}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-slate-100 tracking-tight flex items-center gap-1.5">
                  TeamTask
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    KTU
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  Engineering Ops System
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#101725] border border-[#1B2434] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group
                  ${
                    isActive
                      ? "bg-[#142B52] text-blue-200 border border-blue-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#101725]"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Course Syllabus Note Footer */}
        {!collapsed && (
          <div className="p-3 mx-3 mb-4 rounded-lg bg-[#0B0F18] border border-[#1B2434] text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>KTU PBMET504</span>
            </div>
            <p className="text-[10px] leading-tight text-slate-400">
              Management for Engineers (2024 Scheme) Project Planning & Monitoring.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
