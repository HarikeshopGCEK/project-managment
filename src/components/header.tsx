"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import {
  Menu,
  Plus,
  LogOut,
  User,
  Shield,
  Layers,
  ChevronDown,
} from "lucide-react";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout, isConfigured } = useAuth();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-[#080B12]/80 backdrop-blur-md border-b border-[#1B2434] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      {/* Left section: Mobile Toggle & Project Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#101725] rounded-lg lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-slate-300">Engineering Workspaces</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">Operations Console</span>
        </div>
      </div>

      {/* Right section: Quick Action + User Menu */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </Link>

        {/* User Profile Pill / Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#101725] border border-transparent hover:border-[#1B2434] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center text-xs font-bold">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-none">
                {user?.displayName || "Guest"}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {user?.department || user?.email || "Engineer"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setUserDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-[#1B2434] text-xs">
                <p className="font-semibold text-slate-200">{user?.displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400">
                  <Shield className="w-3 h-3" />
                  <span>{isConfigured ? "Firebase Authenticated" : "Demo Account"}</span>
                </div>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#101725] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile & Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
