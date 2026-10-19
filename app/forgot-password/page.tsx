"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { FolderGit2, Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendResetEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendResetEmail(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to dispatch password recovery email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Password Recovery
          </h1>
          <p className="text-xs text-slate-400">
            Reset your TeamTask engineering workspace password
          </p>
        </div>

        <div className="bg-[#0B0F18] border border-[#1B2434] rounded-xl p-6 shadow-2xl space-y-5">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  Recovery Email Dispatched
                </h3>
                <p className="text-xs text-slate-400">
                  {isConfigured
                    ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
                    : `In development demo mode, password reset requests are simulated. You can return to login and test any demo account.`}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          ) : (
            <>
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
                    Enter Registered Email
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send Password Reset Link"
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
