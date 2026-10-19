"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { DEMO_USERS } from "@/src/lib/demo-data";
import { FirebaseSetupModal } from "@/src/components/firebase-setup-modal";
import {
  FolderGit2,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const { login, googleSignIn, switchDemoUser, isDemoMode } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await googleSignIn();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in requires active Firebase credentials in .env.local."
      );
    }
  };

  const handleQuickDemoLogin = (user: (typeof DEMO_USERS)[0]) => {
    switchDemoUser(user);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            TeamTask Portal
          </h1>
          <p className="text-xs text-slate-400">
            KTU PBMET504 Management for Engineers (2024 Scheme)
          </p>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="p-3 bg-[#0B1528] border border-[#142B52] rounded-xl text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Dev Demo Mode Active
              </span>
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> Setup Info
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Firebase credentials are not configured in <code className="text-slate-300">.env.local</code>. Select a sample role below to enter the dashboard immediately:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u)}
                  className="px-2 py-1.5 bg-[#080B12] hover:bg-[#101725] border border-[#1B2434] hover:border-blue-500/40 rounded-lg text-left transition-colors flex items-center justify-between"
                >
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-200 truncate">{u.displayName}</p>
                    <p className="text-[10px] text-blue-400 capitalize">
                      {u.uid === "demo-uid-rahul" ? "Project Owner" : u.uid === "demo-uid-anjali" ? "Manager" : u.uid === "demo-uid-siddharth" ? "Member" : "Viewer"}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#0B0F18] border border-[#1B2434] rounded-xl p-6 shadow-2xl space-y-5">
          <div className="border-b border-[#1B2434] pb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your registered engineering credentials
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@ktu.edu.in"
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Authenticate & Open Workspace"
              )}
            </button>
          </form>

          {/* Social login */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1B2434]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0B0F18] text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2 px-3 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.2.2-2 .4-2.7L1.9 6.4C.7 8.8 0 11.3 0 14s.7 5.2 1.9 7.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="text-center pt-2 text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <FirebaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
}
