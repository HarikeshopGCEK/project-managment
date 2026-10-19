"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { AppLayout } from "@/src/components/app-layout";
import { createProject } from "@/src/lib/data-service";
import type { ProjectStatus } from "@/src/types";
import {
  FolderPlus,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Layers,
  AlertCircle,
  Target,
} from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<string[]>([
    "Define system requirements and functional architecture specifications",
  ]);
  const [newObjective, setNewObjective] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("250000");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setStartDate(new Date().toISOString().split("T")[0]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a project.");
      return;
    }
    if (!deadline) {
      setError("Please specify a project completion deadline.");
      return;
    }
    if (new Date(deadline) < new Date(startDate)) {
      setError("Project deadline cannot be earlier than start date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createProject(
        {
          name: name.trim(),
          description: description.trim(),
          objectives: objectives.length > 0 ? objectives : ["Deliver project milestones"],
          ownerId: user.uid,
          ownerEmail: user.email,
          ownerName: user.displayName,
          startDate,
          deadline,
          budget: Number(budget) || 0,
          status,
        },
        user
      );

      router.push(`/projects/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/projects" className="hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">New Workspace</span>
        </div>

        {/* Card */}
        <div className="bg-[#0B0F18] border border-[#1B2434] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#1B2434] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                  Create Engineering Project
                </h1>
                <p className="text-xs text-slate-400">
                  Establish a collaborative project under KTU PBMET504 Management guidelines
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Project Title <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Autonomous Robotic Manipulator with Vision Telemetry"
                className="w-full px-3.5 py-2.5 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Engineering Scope & Abstract <span className="text-blue-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe project objectives, engineering methodology, deliverables, and course context..."
                className="w-full px-3.5 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Dynamic Objectives */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Measurable Project Objectives
              </label>
              <div className="space-y-2">
                {objectives.map((obj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#080B12] border border-[#1B2434]"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-slate-300 text-xs">{obj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddObjective();
                      }
                    }}
                    placeholder="Add an objective (press enter or click Add)..."
                    className="flex-1 px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-3 py-2 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] text-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Dates & Budget Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Target Deadline <span className="text-blue-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  Budget Allocated (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Initial Status */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Initial Project Status
              </label>
              <select
                aria-label="Initial Project Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 bg-[#050608] border border-[#1B2434] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="active">Active (Execution Phase)</option>
                <option value="planned">Planned (Charter & Scoping)</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#1B2434] flex items-center justify-end gap-3">
              <Link
                href="/projects"
                className="px-4 py-2 bg-[#101725] hover:bg-[#142B52] border border-[#1B2434] text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Project & Launch Workspace"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
