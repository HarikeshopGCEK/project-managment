"use client";

import React, { useState } from "react";
import { AppLayout } from "@/src/components/app-layout";
import {
  calculateEMV,
  calculateCPM,
  type EMVAnalysisResult,
  type CPMAnalysisResult,
} from "@/src/lib/academic-tools";
import { formatCurrencyINR } from "@/src/lib/utils";
import type { EMVAlternative, CPMActivity } from "@/src/types";
import {
  Cpu,
  GitCommit,
  Calculator,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

// Pre-populated realistic engineering capstone CPM network
const INITIAL_CPM_ACTIVITIES: CPMActivity[] = [
  { id: "1", code: "A", name: "System Requirements & Hardware Specification", durationDays: 10, predecessors: [] },
  { id: "2", code: "B", name: "Procure Sensors & Flight Controller", durationDays: 15, predecessors: ["A"] },
  { id: "3", code: "C", name: "Airframe Structural Fabrication & Stress Test", durationDays: 20, predecessors: ["A"] },
  { id: "4", code: "D", name: "ROS2 Driver Integration & Micro-ROS Bridge", durationDays: 14, predecessors: ["B"] },
  { id: "5", code: "E", name: "LiDAR SLAM Algorithm Tuning in Gazebo", durationDays: 25, predecessors: ["B"] },
  { id: "6", code: "F", name: "Payload Integration on Airframe", durationDays: 8, predecessors: ["C", "D"] },
  { id: "7", code: "G", name: "Flight Controller Calibration & PID Tuning", durationDays: 12, predecessors: ["F"] },
  { id: "8", code: "H", name: "Autonomous Obstacle Avoidance Field Trials", durationDays: 18, predecessors: ["E", "G"] },
  { id: "9", code: "I", name: "KTU Capstone Documentation & Evaluation", durationDays: 7, predecessors: ["H"] },
];

// Pre-populated realistic EMV engineering decision alternatives
const INITIAL_EMV_ALTERNATIVES: EMVAlternative[] = [
  {
    id: "alt-1",
    name: "Strategy 1: High-End Solid-State LiDAR (Livox Mid-360)",
    description: "High precision 3D mapping with low drift, but higher initial capital cost.",
    outcomes: [
      { id: "o1", name: "Flawless Flight Inspection Approval", probability: 0.7, payoff: 650000 },
      { id: "o2", name: "Minor Sensor Recalibration Required", probability: 0.2, payoff: 420000 },
      { id: "o3", name: "Inclement Weather Interference", probability: 0.1, payoff: 150000 },
    ],
  },
  {
    id: "alt-2",
    name: "Strategy 2: Stereo Vision Camera + Ultrasonic Sensors",
    description: "Low hardware cost, but software latency and lighting sensitivity risks.",
    outcomes: [
      { id: "o4", name: "Optimal Sunlight Conditions", probability: 0.5, payoff: 480000 },
      { id: "o5", name: "Low-Light Feature Tracking Dropouts", probability: 0.3, payoff: 200000 },
      { id: "o6", name: "Vision Occlusion Failure", probability: 0.2, payoff: -50000 },
    ],
  },
  {
    id: "alt-3",
    name: "Strategy 3: Hybrid Multimodal Sensor Fusion",
    description: "Redundant sensors with Kalman Filter; balanced risk and operational certainty.",
    outcomes: [
      { id: "o7", name: "Full Academic & Commercial Compliance", probability: 0.65, payoff: 720000 },
      { id: "o8", name: "Sensor Synchronization Delay", probability: 0.25, payoff: 380000 },
      { id: "o9", name: "Hardware Power Drain Issue", probability: 0.1, payoff: 100000 },
    ],
  },
];

export default function AcademicToolsPage() {
  const [activeTab, setActiveTab] = useState<"cpm" | "emv">("cpm");

  // CPM State
  const [cpmActivities, setCpmActivities] = useState<CPMActivity[]>(INITIAL_CPM_ACTIVITIES);
  const [cpmResult, setCpmResult] = useState<CPMAnalysisResult>(() =>
    calculateCPM(INITIAL_CPM_ACTIVITIES)
  );

  // EMV State
  const [emvResult, setEmvResult] = useState<EMVAnalysisResult>(() =>
    calculateEMV(INITIAL_EMV_ALTERNATIVES)
  );

  // New CPM Activity inputs
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("5");
  const [newPreds, setNewPreds] = useState("");

  const handleRecalculateCPM = () => {
    const res = calculateCPM(cpmActivities);
    setCpmResult(res);
  };

  const handleAddCPMActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const preds = newPreds
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);

    const newAct: CPMActivity = {
      id: String(Date.now()),
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      durationDays: Number(newDuration) || 1,
      predecessors: preds,
    };

    const updated = [...cpmActivities, newAct];
    setCpmActivities(updated);
    setCpmResult(calculateCPM(updated));

    setNewCode("");
    setNewName("");
    setNewPreds("");
  };

  const handleRemoveCPM = (id: string) => {
    const updated = cpmActivities.filter((a) => a.id !== id);
    setCpmActivities(updated);
    setCpmResult(calculateCPM(updated));
  };

  const handleResetCPM = () => {
    setCpmActivities(INITIAL_CPM_ACTIVITIES);
    setCpmResult(calculateCPM(INITIAL_CPM_ACTIVITIES));
  };

  const handleResetEMV = () => {
    setCpmResult(calculateCPM(cpmActivities));
    setEmvResult(calculateEMV(INITIAL_EMV_ALTERNATIVES));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B2434] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PBMET504 Management for Engineers (2024 Scheme)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5 mt-1.5">
              <Cpu className="w-6 h-6 text-blue-400" />
              Academic Management Decision Tools
            </h1>
            <p className="text-xs text-slate-400">
              Quantitative models for Critical Path Scheduling (CPM) and Expected Monetary Value (EMV) Decision Trees
            </p>
          </div>

          {/* Sub Navigation Toggle */}
          <div className="flex items-center bg-[#0B0F18] border border-[#1B2434] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("cpm")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "cpm"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>CPM Network Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab("emv")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "emv"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>EMV Decision Engine</span>
            </button>
          </div>
        </div>

        {/* 1. CPM / PERT TAB */}
        {activeTab === "cpm" && (
          <div className="space-y-6 text-xs">
            {/* CPM Results Banner */}
            <div
              className={`p-5 rounded-xl border ${
                cpmResult.hasCycle
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-[#0B1528] border-[#142B52]"
              }`}
            >
              {cpmResult.hasCycle ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-rose-300">
                      Cycle Detected in Activity Network!
                    </h3>
                    <p className="text-xs leading-relaxed">{cpmResult.cycleError}</p>
                    <p className="text-[11px] text-slate-400">
                      In project scheduling (KTU PBMET504 Module 4), an activity network must form a
                      strictly Directed Acyclic Graph (DAG). An activity cannot be a predecessor to its
                      own ancestor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-blue-300 uppercase font-semibold">
                      Network Analysis Results
                    </span>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <span>Total Project Duration: </span>
                      <span className="text-blue-400 font-mono">
                        {cpmResult.totalProjectDuration} Working Days
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-400">Identified Critical Path:</span>
                      <div className="flex items-center gap-1.5">
                        {cpmResult.criticalPath.map((code, idx) => (
                          <React.Fragment key={code}>
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
                              {code}
                            </span>
                            {idx < cpmResult.criticalPath.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-200">Critical Path Rule:</p>
                    <p>Activities on the critical path have Total Float (Slack) = 0.</p>
                    <p>Any delay along this path directly delays the overall project completion.</p>
                  </div>
                </div>
              )}
            </div>

            {/* CPM Activity Table */}
            <div className="rounded-xl bg-[#0B0F18] border border-[#1B2434] overflow-hidden shadow-lg">
              <div className="px-5 py-3 border-b border-[#1B2434] bg-[#080B12] flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-blue-400" />
                  Forward & Backward Pass Schedule Matrix
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecalculateCPM}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCw className="w-3 h-3" /> Recalculate Network
                  </button>
                  <button
                    onClick={handleResetCPM}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Capstone Network
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050608] border-b border-[#1B2434] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-4">Activity Name / Scope</th>
                      <th className="py-3 px-3 text-center">Duration</th>
                      <th className="py-3 px-3">Predecessors</th>
                      <th className="py-3 px-3 text-center">ES</th>
                      <th className="py-3 px-3 text-center">EF</th>
                      <th className="py-3 px-3 text-center">LS</th>
                      <th className="py-3 px-3 text-center">LF</th>
                      <th className="py-3 px-3 text-center">Slack</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2434]">
                    {cpmResult.activities.map((act) => (
                      <tr
                        key={act.id}
                        className={`transition-colors ${
                          act.isCritical
                            ? "bg-rose-500/5 hover:bg-rose-500/10 font-medium"
                            : "hover:bg-[#101725]/50"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">{act.code}</td>
                        <td className="py-3 px-4 text-slate-200">{act.name}</td>
                        <td className="py-3 px-3 text-center font-mono">{act.durationDays}d</td>
                        <td className="py-3 px-3">
                          {act.predecessors.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {act.predecessors.map((p) => (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded bg-[#101725] text-slate-300 font-mono text-[10px]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{act.es}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{act.ef}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{act.ls}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{act.lf}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={
                              act.slack === 0
                                ? "text-rose-400 font-bold"
                                : "text-emerald-400 font-semibold"
                            }
                          >
                            {act.slack}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {act.isCritical ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              CRITICAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400">
                              Float
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRemoveCPM(act.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Custom CPM Activity Form */}
            <div className="p-5 rounded-xl bg-[#0B0F18] border border-[#1B2434] space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Append Custom Engineering Activity
              </h4>
              <form onSubmit={handleAddCPMActivity} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Activity Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. J"
                    className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded text-slate-200 uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Activity Description</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Flight Telemetry Benchmarking"
                    className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Predecessors (CSV)</label>
                  <input
                    type="text"
                    value={newPreds}
                    onChange={(e) => setNewPreds(e.target.value)}
                    placeholder="e.g. H, G"
                    className="w-full px-2.5 py-1.5 bg-[#050608] border border-[#1B2434] rounded text-slate-200 uppercase"
                  />
                </div>
                <div className="sm:col-span-5 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add & Recalculate CPM
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EMV TAB */}
        {activeTab === "emv" && (
          <div className="space-y-6 text-xs">
            {/* Top EMV Recommendation Banner */}
            <div className="p-5 rounded-xl bg-[#0B1528] border border-[#142B52] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-300 uppercase font-semibold">
                  Decision Tree Criterion: Maximum Expected Monetary Value
                </span>
                <button
                  onClick={handleResetEMV}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Payoff Matrix
                </button>
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Optimal Decision: </span>
                <span className="text-emerald-400">{emvResult.bestAlternativeName}</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{emvResult.recommendation}</p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="font-mono bg-[#080B12] px-2 py-0.5 rounded border border-[#1B2434]">
                  Formula: EMV = ∑ (Probability × Payoff)
                </span>
                <span>KTU PBMET504 Module 2: Decision Theory under Risk</span>
              </div>
            </div>

            {/* Alternatives Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {emvResult.alternatives.map((alt) => {
                const isBest = alt.id === emvResult.bestAlternativeId;

                return (
                  <div
                    key={alt.id}
                    className={`p-5 rounded-xl bg-[#0B0F18] border flex flex-col justify-between transition-all shadow-lg ${
                      isBest ? "border-emerald-500/50 shadow-emerald-950/20" : "border-[#1B2434]"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{alt.name}</h4>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            OPTIMAL
                          </span>
                        )}
                      </div>

                      {alt.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{alt.description}</p>
                      )}

                      {/* EMV Highlight */}
                      <div className="p-3 rounded-lg bg-[#080B12] border border-[#1B2434] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Expected Monetary Value (EMV)
                        </span>
                        <p
                          className={`text-xl font-bold font-mono ${
                            alt.emv >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatCurrencyINR(alt.emv)}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          Probability Sum: {alt.probabilitySum}
                          {alt.isValidProbabilities ? " (Valid 1.0)" : " ⚠️ Warning: ≠ 1.0"}
                        </span>
                      </div>

                      {/* Outcomes Table */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Outcome Probabilities & Payoffs
                        </span>
                        <div className="space-y-1.5">
                          {alt.outcomesBreakdown.map((out, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-[#080B12] border border-[#1B2434] flex items-center justify-between text-[11px]"
                            >
                              <div className="truncate max-w-[140px]">
                                <p className="text-slate-300 truncate">{out.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  P = {out.probability} | Payoff = {formatCurrencyINR(out.payoff)}
                                </p>
                              </div>
                              <span className="font-mono text-slate-200">
                                {formatCurrencyINR(out.expectedValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
