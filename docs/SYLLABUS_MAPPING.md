# KTU PBMET504 Management for Engineers (2024 Scheme)
## Comprehensive Syllabus Mapping Document for TeamTask

This document provides a formal mapping of the features, data structures, algorithms, and workflows implemented in **TeamTask** to the course syllabus of **PBMET504 Management for Engineers** under the APJ Abdul Kalam Technological University (KTU) 2024 scheme.

---

### Module 1: Overview of Management & The Planning Function

| Syllabus Topic | Academic Concept | TeamTask Implementation | Source Code / Route Reference |
|---|---|---|---|
| **Definitions & Functions of Management** | Planning, Organizing, Staffing, Leading, and Controlling (POSDCORB) | Core system architecture is partitioned across four operational zones corresponding to the POSDCORB framework. | Whole application |
| **Project Planning Process** | Formulation of project charters, scope definitions, objectives, and time bounds | The Project Creation wizard enforces measurable objectives, start dates, hard deadlines, and estimated budget allocations. | `app/projects/new/page.tsx` |
| **Management by Objectives (MBO)** | Aligning individual engineer deliverables with overarching organizational goals | Deliverable tasks are linked to parent project objectives with clear priority weighting (Critical, High, Medium, Low). | `app/projects/[projectId]/page.tsx` & `app/projects/[projectId]/tasks/page.tsx` |
| **Work Breakdown Structure (WBS)** | Hierarchical decomposition of the total project scope into deliverables and sub-tasks | Projects decompose into tasks, which further decompose into task comment discussions and checklist execution states. | `src/types/index.ts` & `src/lib/firestore.ts` |

---

### Module 2: Decision Making & Quantitative Models

| Syllabus Topic | Academic Concept | TeamTask Implementation | Source Code / Route Reference |
|---|---|---|---|
| **Decision Making Process** | Rational choice selection among competing engineering alternatives | The Academic Decision Engine provides an interactive simulation interface to analyze competing architectural choices. | `app/academic/page.tsx` |
| **Decision Making under Risk & Uncertainty** | Calculating Expected Monetary Value (EMV) from outcome probabilities and financial payoffs | Implemented full EMV calculator: $$\text{EMV} = \sum (P_i \times V_i)$$ with probability validation ($\sum P = 1.0$) and payoff identification in INR. | `src/lib/academic-tools.ts` (`calculateEMV`) |
| **Payoff Tables & Decision Trees** | Comparative matrix of states of nature versus engineering strategies | Evaluates scenarios such as "Solid-State LiDAR vs. Stereo Vision vs. Sensor Fusion" under uncertain environmental states. | `src/lib/academic-tools.ts` & `app/academic/page.tsx` |

---

### Module 3: Organizing, Delegation & Human Resource Management (HRM)

| Syllabus Topic | Academic Concept | TeamTask Implementation | Source Code / Route Reference |
|---|---|---|---|
| **Principles of Organizing** | Division of labor, span of control, scalar chain, and unity of command | Multi-user project roster system with strict role boundaries (Owner $\to$ Manager $\to$ Member $\to$ Viewer). | `src/types/index.ts` & `firestore.rules` |
| **Delegation of Authority & Responsibility** | Transferring authority for task execution while retaining accountability | Project Owners delegate task management and expense tracking to Managers, and deliverable execution to Members. | `app/projects/[projectId]/team/page.tsx` |
| **Responsibility Assignment (RACI Matrix)** | Responsible, Accountable, Consulted, and Informed matrix | - **Accountable:** Project Owner<br>- **Responsible:** Assigned Member<br>- **Consulted:** Project Manager<br>- **Informed:** Academic Viewer / Guide | `firestore.rules` & `src/components/ui/badges.tsx` |
| **Workload Balancing & Staffing** | Capacity tracking to prevent burnout and resolve engineering resource bottlenecks | Cross-project Team Workload console tracking assigned, completed, in-progress, and overdue task distributions. | `app/team/page.tsx` |

---

### Module 4: Project Management, CPM/PERT & Controlling

| Syllabus Topic | Academic Concept | TeamTask Implementation | Source Code / Route Reference |
|---|---|---|---|
| **Project Scheduling Techniques** | Network diagrams, activity-on-node (AON), and sequence dependencies | Interactive CPM Network Analyzer computing network paths for engineering project activities. | `src/lib/academic-tools.ts` & `app/academic/page.tsx` |
| **Directed Acyclic Graph (DAG) Validation** | Precedence relationships without circular deadlock | Algorithmic cycle detection using three-color DFS graph coloring; rejects non-DAG networks with cycle node trace. | `src/lib/academic-tools.ts` (`calculateCPM`) |
| **Forward Pass Scheduling** | Earliest Start (ES) and Earliest Finish (EF) calculations | Computed as: $$ES_i = \max(EF_{\text{preds}}), \quad EF_i = ES_i + \text{Duration}_i$$ | `src/lib/academic-tools.ts` (`calculateCPM`) |
| **Backward Pass Scheduling** | Latest Finish (LF) and Latest Start (LS) calculations | Computed in reverse topological order as: $$LF_i = \min(LS_{\text{succs}}), \quad LS_i = LF_i - \text{Duration}_i$$ | `src/lib/academic-tools.ts` (`calculateCPM`) |
| **Total Float / Slack & Critical Path** | Identifying zero-float activities that constrain the minimum project duration | Calculates $$\text{Slack} = LS - ES$$. Flags activities with Slack $= 0$ as CRITICAL and highlights the critical path. | `src/lib/academic-tools.ts` & `app/academic/page.tsx` |
| **Controlling & Variance Analysis** | Comparing planned benchmarks against actual execution | Automated calculation of schedule slippage (overdue tasks) and deliverable completion rates. | `app/dashboard/page.tsx` & `app/reports/page.tsx` |
| **Budgetary Control & Variance** | Tracking expenditures against sanctioned budget ceilings in INR | Incurred expenses logged by category (Hardware, Software, Labor, Testing, Travel, Misc); alerts on cost overruns. | `app/expenses/page.tsx` |
| **Audit Trails & Management Information** | Maintaining tamper-evident records of managerial interventions | Append-only activity logs recorded on project creation, member changes, task updates, and expense entries. | `src/lib/firestore.ts` & `app/dashboard/page.tsx` |

---

### Summary Checklist for Evaluation

- [x] All 4 core modules of KTU PBMET504 are directly demonstrated with functional code and UI.
- [x] Quantitative calculation engines (CPM & EMV) strictly follow academic formulas.
- [x] Security rules and data model enforce organizational hierarchy and delegation boundaries.
- [x] Printable evaluation report (`/reports`) is structured for PBL evaluation.
