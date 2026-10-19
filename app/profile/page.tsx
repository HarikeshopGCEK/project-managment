"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { getFirebaseConfigStatus } from "@/src/lib/firebase-config";
import { FirebaseSetupModal } from "@/src/components/firebase-setup-modal";
import { DEMO_USERS } from "@/src/lib/demo-data";
import {
  UserCircle,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Layers,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, isConfigured, isDemoMode, switchDemoUser } = useAuth();
  const router = useRouter();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const configStatus = getFirebaseConfigStatus();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 text-xs">
        {/* Header */}
        <div className="border-b border-[#1B2434] pb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <UserCircle className="w-6 h-6 text-blue-400" />
            Engineering Profile & Backend Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal identity credentials and cloud database connection diagnostics
          </p>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xl shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{user?.displayName}</h2>
              <p className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {user?.department || "Department of Mechanical & Robotics Engineering"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1B2434]">
            <div className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] space-y-1">
              <span className="text-[10px] text-slate-500 block">Firebase UID</span>
              <span className="font-mono text-slate-300 text-[11px] block truncate">
                {user?.uid || "N/A"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] space-y-1">
              <span className="text-[10px] text-slate-500 block">Account Status</span>
              <span className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isConfigured ? "Authenticated (Cloud Firebase)" : "Active (Dev Demo Store)"}
              </span>
            </div>
          </div>
        </div>

        {/* Backend Configuration Diagnostics Card */}
        <div className="p-6 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1B2434] pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Firebase Cloud Integration Status
            </h3>
            <button
              onClick={() => setShowSetupModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-md transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              <span>Setup Guide</span>
            </button>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              configStatus.isConfigured
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/20 text-amber-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {configStatus.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {configStatus.isConfigured
                    ? "Production Cloud Firebase Connected"
                    : "Development Demo Mode Active (Isolated Local Storage)"}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {configStatus.isConfigured
                    ? `Live Firestore database and Firebase Authentication active for Project "${configStatus.projectId}".`
                    : "Firebase environment variables are currently empty in .env.local. The application is running in an isolated development demo mode. All data is persisted in browser local storage for complete UI and workflow evaluation. Once credentials are provided in .env.local, Firebase Authentication and Firestore will be used automatically without any code changes."}
                </p>
              </div>
            </div>
          </div>

          {/* Variables Status List */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Environment Variables in .env.local
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "NEXT_PUBLIC_FIREBASE_API_KEY",
                "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
                "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
                "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
                "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
                "NEXT_PUBLIC_FIREBASE_APP_ID",
              ].map((key) => {
                const isSet = !configStatus.missingKeys.includes(key);
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded bg-[#080B12] border border-[#1B2434] flex items-center justify-between font-mono text-[11px]"
                  >
                    <span className="text-slate-300 truncate max-w-[200px]">{key}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isSet
                          ? "bg-emerald-500/20 text-emerald-300 font-bold"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {isSet ? "Configured" : "Placeholder"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Demo User Switcher */}
        {isDemoMode && (
          <div className="p-6 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3 shadow-lg">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Demo Role Persona Switcher
            </h3>
            <p className="text-[11px] text-slate-400">
              Instantly toggle between distinct academic roles to test the authorization boundaries and permissions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_USERS.map((u) => {
                const isCurrent = u.uid === user?.uid;
                const roleTitle =
                  u.uid === "demo-uid-rahul"
                    ? "Project Owner"
                    : u.uid === "demo-uid-anjali"
                    ? "Manager"
                    : u.uid === "demo-uid-siddharth"
                    ? "Member"
                    : "Viewer (Faculty Guide)";

                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => {
                      switchDemoUser(u);
                      window.location.reload();
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? "bg-[#142B52] border-blue-500/50 text-white shadow"
                        : "bg-[#080B12] border-[#1B2434] hover:bg-[#101725] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{u.displayName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                        {roleTitle}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{u.department}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Logout Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from Workspace</span>
          </button>
        </div>
      </div>

      <FirebaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </AppLayout>
  );
}
