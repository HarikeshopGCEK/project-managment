"use client";

import React, { useState } from "react";
import { useAuth } from "@/src/context/auth-context";
import { DEMO_USERS } from "@/src/lib/demo-data";
import { resetDemoStore } from "@/src/lib/data-service";
import { FirebaseSetupModal } from "./firebase-setup-modal";
import { UserCheck, RefreshCw, KeyRound } from "lucide-react";

export function DemoModeBanner() {
  const { isDemoMode, user, switchDemoUser } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);

  if (!isDemoMode) return null;

  const handleResetData = () => {
    if (confirm("Reset demo data to initial KTU Capstone engineering projects and tasks?")) {
      resetDemoStore();
      window.location.reload();
    }
  };

  return (
    <>
      <div className="bg-[#0B1528] border-b border-[#142B52] px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Status Message */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-medium text-amber-300">Development Demo Mode</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-400">
              Firebase credentials pending in <code className="bg-[#080B12] px-1 py-0.5 rounded text-slate-200">.env.local</code>. UI & workflows fully testable.
            </span>
          </div>

          {/* Quick Demo Controls */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* User Switcher */}
            <div className="flex items-center gap-1.5 bg-[#080B12] border border-[#1B2434] px-2 py-1 rounded-md">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-slate-400 hidden md:inline">Test Role:</span>
              <select
                aria-label="Test Role Switcher"
                value={user?.uid || ""}
                onChange={(e) => {
                  const target = DEMO_USERS.find((u) => u.uid === e.target.value);
                  if (target) {
                    switchDemoUser(target);
                    window.location.reload();
                  }
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u.uid} value={u.uid} className="bg-[#0B0F18] text-slate-200">
                    {u.displayName} ({u.uid === "demo-uid-rahul" ? "Owner" : u.uid === "demo-uid-anjali" ? "Manager" : u.uid === "demo-uid-siddharth" ? "Member" : "Viewer"})
                  </option>
                ))}
              </select>
            </div>

            {/* Setup Guide Button */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-md transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              <span>Firebase Setup</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              title="Reset Demo Data"
              className="p-1 hover:bg-[#101725] text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <FirebaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </>
  );
}
