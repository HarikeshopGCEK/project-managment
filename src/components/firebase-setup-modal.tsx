"use client";

import React, { useState } from "react";
import { getFirebaseConfigStatus } from "@/src/lib/firebase-config";
import { X, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink, ShieldAlert } from "lucide-react";

export function FirebaseSetupModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = getFirebaseConfigStatus();

  if (!isOpen) return null;

  const sampleEnvContent = `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef...`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleEnvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B0F18] border border-[#1B2434] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B2434] bg-[#080B12]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Firebase Integration & Setup Guide
              </h3>
              <p className="text-xs text-slate-400">
                Configure your cloud backend without modifying application source code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#101725] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-300">
          {/* Status Box */}
          <div
            className={`p-4 rounded-lg border ${
              status.isConfigured
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {status.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-semibold text-sm">
                  {status.isConfigured
                    ? "Firebase Credentials Active"
                    : "Development Demo Mode Active (Isolated Local Storage)"}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {status.isConfigured
                    ? `Connected to Firebase Project ID: "${status.projectId}". Live Cloud Firestore and Firebase Auth are operational.`
                    : "The application is currently functioning in dev-demo mode. Missing environment variables in .env.local: " +
                      (status.missingKeys.length > 0 ? status.missingKeys.join(", ") : "None")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-xs">
                1
              </span>
              Acquire Credentials from Firebase Console
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 pl-2">
              <li>
                Open the{" "}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and select your project.
              </li>
              <li>
                Navigate to <strong>Project Settings</strong> (gear icon) &gt;{" "}
                <strong>General</strong> &gt; <strong>Your apps</strong>.
              </li>
              <li>
                Add a <strong>Web App (&lt;/&gt;)</strong> and copy the config values.
              </li>
              <li>
                Enable <strong>Authentication &gt; Sign-in method &gt; Email/Password</strong>.
              </li>
              <li>
                Create a <strong>Cloud Firestore</strong> database.
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-xs">
                  2
                </span>
                Populate `.env.local`
              </h4>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Template"}
              </button>
            </div>
            <pre className="p-3 bg-[#050608] border border-[#1B2434] rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {sampleEnvContent}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-xs">
                3
              </span>
              Deploy Security Rules & Restart Server
            </h4>
            <div className="p-3 bg-[#050608] border border-[#1B2434] rounded-lg text-xs font-mono text-slate-300 space-y-1">
              <p className="text-slate-400"># Deploy production security rules:</p>
              <p className="text-blue-400">firebase deploy --only firestore:rules</p>
              <p className="text-slate-400 mt-2"># Restart Next.js dev server:</p>
              <p className="text-blue-400">npm run dev</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1B2434] bg-[#080B12] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
