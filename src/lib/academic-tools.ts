import type { EMVAlternative, CPMActivity } from "@/src/types";

// ==========================================
// 1. EXPECTED MONETARY VALUE (EMV) ENGINE
// ==========================================

export interface EMVResultAlternative {
  id: string;
  name: string;
  description?: string;
  emv: number;
  probabilitySum: number;
  isValidProbabilities: boolean;
  outcomesBreakdown: {
    name: string;
    probability: number;
    payoff: number;
    expectedValue: number;
  }[];
}

export interface EMVAnalysisResult {
  alternatives: EMVResultAlternative[];
  bestAlternativeId: string | null;
  bestAlternativeName: string | null;
  maxEMV: number;
  recommendation: string;
}

export function calculateEMV(alternatives: EMVAlternative[]): EMVAnalysisResult {
  if (!alternatives || alternatives.length === 0) {
    return {
      alternatives: [],
      bestAlternativeId: null,
      bestAlternativeName: null,
      maxEMV: 0,
      recommendation: "No alternatives provided for analysis.",
    };
  }
  const analyzedAlternatives: EMVResultAlternative[] = alternatives.map((alt) => {
    let altEMV = 0;
    let probSum = 0;

    const outcomesBreakdown = alt.outcomes.map((out) => {
      const prob = Number(out.probability) || 0;
      const payoff = Number(out.payoff) || 0;
      const expectedValue = prob * payoff;
      altEMV += expectedValue;
      probSum += prob;

      return {
        name: out.name,
        probability: prob,
        payoff: payoff,
        expectedValue,
      };
    });

    const isValidProbabilities = Math.abs(probSum - 1.0) < 0.01;

    const res: EMVResultAlternative = {
      id: alt.id,
      name: alt.name,
      description: alt.description,
      emv: Math.round(altEMV * 100) / 100,
      probabilitySum: Math.round(probSum * 100) / 100,
      isValidProbabilities,
      outcomesBreakdown,
    };

    return res;
  });

  let bestAlt: EMVResultAlternative | null = null;
  for (const alt of analyzedAlternatives) {
    if (!bestAlt || alt.emv > bestAlt.emv) {
      bestAlt = alt;
    }
  }

  return {
    alternatives: analyzedAlternatives,
    bestAlternativeId: bestAlt ? (bestAlt as EMVResultAlternative).id : null,
    bestAlternativeName: bestAlt ? (bestAlt as EMVResultAlternative).name : null,
    maxEMV: bestAlt ? (bestAlt as EMVResultAlternative).emv : 0,
    recommendation: bestAlt
      ? `Alternative "${(bestAlt as EMVResultAlternative).name}" yields the highest Expected Monetary Value of ₹${(bestAlt as EMVResultAlternative).emv.toLocaleString("en-IN")}.`
      : "No optimal alternative found.",
  };
}

// ==========================================
// 2. CRITICAL PATH METHOD (CPM / PERT) ENGINE
// ==========================================

export interface CPMAnalysisResult {
  activities: CPMActivity[];
  criticalPath: string[]; // array of activity codes
  totalProjectDuration: number;
  hasCycle: boolean;
  cycleError?: string;
}

export function calculateCPM(activitiesInput: CPMActivity[]): CPMAnalysisResult {
  if (!activitiesInput || activitiesInput.length === 0) {
    return {
      activities: [],
      criticalPath: [],
      totalProjectDuration: 0,
      hasCycle: false,
    };
  }

  // Clone to avoid mutating inputs
  const activities: CPMActivity[] = activitiesInput.map((a) => ({
    ...a,
    durationDays: Math.max(0, Number(a.durationDays) || 0),
    predecessors: (a.predecessors || []).map((p) => p.trim()).filter(Boolean),
    es: 0,
    ef: 0,
    ls: 0,
    lf: 0,
    slack: 0,
    isCritical: false,
  }));

  const codeMap = new Map<string, CPMActivity>();
  activities.forEach((act) => codeMap.set(act.code, act));

  // 1. Cycle Detection using DFS
  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  let cycleNode = "";

  function hasCycleDfs(nodeCode: string): boolean {
    visited.set(nodeCode, 1);
    const act = codeMap.get(nodeCode);
    if (act) {
      for (const pred of act.predecessors) {
        if (!codeMap.has(pred)) continue;
        const state = visited.get(pred) || 0;
        if (state === 1) {
          cycleNode = `${nodeCode} -> ${pred}`;
          return true;
        }
        if (state === 0 && hasCycleDfs(pred)) {
          return true;
        }
      }
    }
    visited.set(nodeCode, 2);
    return false;
  }

  for (const act of activities) {
    if ((visited.get(act.code) || 0) === 0) {
      if (hasCycleDfs(act.code)) {
        return {
          activities,
          criticalPath: [],
          totalProjectDuration: 0,
          hasCycle: true,
          cycleError: `Circular dependency detected involving: ${cycleNode}. Directed Acyclic Graph (DAG) violated.`,
        };
      }
    }
  }

  // 2. Topological Sort for Forward Pass
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>(); // predecessor -> successors

  activities.forEach((act) => {
    inDegree.set(act.code, 0);
    adj.set(act.code, []);
  });

  activities.forEach((act) => {
    act.predecessors.forEach((pred) => {
      if (codeMap.has(pred)) {
        adj.get(pred)?.push(act.code);
        inDegree.set(act.code, (inDegree.get(act.code) || 0) + 1);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((deg, code) => {
    if (deg === 0) queue.push(code);
  });

  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedOrder.push(curr);
    for (const neighbor of adj.get(curr) || []) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // 3. Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
  let projectDuration = 0;

  for (const code of sortedOrder) {
    const act = codeMap.get(code)!;
    let maxPredEF = 0;
    for (const pred of act.predecessors) {
      const predAct = codeMap.get(pred);
      if (predAct && predAct.ef !== undefined && predAct.ef > maxPredEF) {
        maxPredEF = predAct.ef;
      }
    }
    act.es = maxPredEF;
    act.ef = act.es + act.durationDays;
    if (act.ef > projectDuration) {
      projectDuration = act.ef;
    }
  }

  // 4. Backward Pass: Latest Finish (LF) and Latest Start (LS)
  // Initialize all LF to projectDuration
  activities.forEach((act) => {
    act.lf = projectDuration;
  });

  // Traverse in reverse topological order
  for (let i = sortedOrder.length - 1; i >= 0; i--) {
    const code = sortedOrder[i];
    const act = codeMap.get(code)!;
    const successors = adj.get(code) || [];

    if (successors.length > 0) {
      let minSuccLS = Infinity;
      for (const succCode of successors) {
        const succAct = codeMap.get(succCode);
        if (succAct && succAct.ls !== undefined && succAct.ls < minSuccLS) {
          minSuccLS = succAct.ls;
        }
      }
      act.lf = minSuccLS === Infinity ? projectDuration : minSuccLS;
    }
    act.ls = (act.lf ?? projectDuration) - act.durationDays;
    act.slack = (act.ls ?? 0) - (act.es ?? 0);
    act.isCritical = act.slack === 0;
  }

  // 5. Extract Critical Path
  const criticalPath = activities
    .filter((a) => a.isCritical)
    .sort((a, b) => (a.es ?? 0) - (b.es ?? 0))
    .map((a) => a.code);

  return {
    activities,
    criticalPath,
    totalProjectDuration: projectDuration,
    hasCycle: false,
  };
}
