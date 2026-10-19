# Academic Project Report: TeamTask
## Engineering Project Planning and Monitoring System

**Course:** KTU PBMET504 Management for Engineers (2024 Scheme)  
**Academic Submission:** Project-Based Learning (PBL) Assessment  
**Date:** October 2026  

---

### Abstract
Engineering project management requires rigorous synchronization of human resources, schedules, financial constraints, and technical deliverables. Traditional single-user productivity tools fail to enforce project ownership, collaborative accountability, and role-based data isolation. This report presents **TeamTask**, a multi-user collaborative operations platform built using Next.js 16, TypeScript, Tailwind CSS, Cloud Firestore, and Firebase Authentication. The system implements core engineering management methodologies prescribed in the KTU PBMET504 syllabus, including Work Breakdown Structure (WBS), Responsibility Assignment Matrices (RAM/RACI), Critical Path Method (CPM/PERT) forward and backward pass scheduling, and Expected Monetary Value (EMV) decision payoff evaluation under operational uncertainty.

---

### 1. Introduction
In engineering organizations and capstone initiatives, execution failure is rarely attributed to technical infeasibility alone; it predominantly stems from organizational fragmentation. Engineering leaders must continuously manage four interrelated dimensions:
1. **Scope and Planning:** Decomposing complex engineering goals into discrete deliverables with measurable acceptance criteria.
2. **Human Resource Allocation:** Assigning responsibilities across multidisciplinary engineers without workload imbalance or authority ambiguities.
3. **Controlling and Variance Monitoring:** Tracking planned vs. actual project completion, identifying schedule bottlenecks, and preventing budget overruns.
4. **Decision Theory:** Objectively selecting technical alternatives when operating under probabilistic environmental constraints.

The KTU PBMET504 syllabus provides the theoretical frameworks for these management pillars. TeamTask translates these theoretical concepts into a high-performance web platform.

---

### 2. Problem Statement
Existing task management utilities exhibit significant shortcomings in engineering contexts:
- **Absence of Role Hierarchy:** Most systems treat all team members identically, lacking strict boundaries between Project Owners (sanctioning budgets), Managers (assigning tasks), and Members (updating deliverables).
- **Decoupled Financial Tracking:** Cost tracking is typically relegated to separate spreadsheets rather than tied directly to project activities, resulting in delayed cost overrun detection.
- **Lack of Quantitative Decision Tools:** Tools lack embedded quantitative decision models such as CPM network analysis and EMV payoff trees.
- **Inadequate Multi-Document Integrity:** Client-side deletions often leave orphaned task assignments and activity logs, compromising audit integrity.

---

### 3. System Objectives
1. **Collaborative Planning:** Enable multi-user registration, project charter creation, objective formulation, and milestone definition.
2. **Role-Based Access Control (RBAC):** Enforce four project roles (Owner, Manager, Member, Viewer) with secure boundary validation in Cloud Firestore rules.
3. **Dynamic Workload Balancing:** Provide real-time engineer capacity tracking showing assigned, completed, in-progress, and overdue deliverables.
4. **Budgetary & Variance Control:** Monitor expenditure against sanctioned caps in Indian Rupees (INR) with automated overrun alerts.
5. **Integrated Academic Management Tools:** Implement an algorithmic CPM engine with Directed Acyclic Graph (DAG) cycle detection and an EMV decision analyzer.
6. **Auditability:** Maintain an immutable chronological activity log for all major engineering operations.

---

### 4. System Architecture & Methodology

#### 4.1 Technology Stack
- **Frontend Layer:** Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4.
- **Visual Design:** Pitch-black operations console (`#050608`) and dark blue accent surfaces (`#142B52`, `#1D4ED8`), designed for high contrast and reduced cognitive load during intensive monitoring.
- **Backend Data Layer:** Cloud Firestore (NoSQL document database) with structured subcollections for atomic isolation.
- **Identity & Authentication:** Firebase Authentication managing salted-hash password verification and session tokens.
- **Security Layer:** Declarative Firestore Security Rules enforcing data isolation at the database engine level.

#### 4.2 Data Model Architecture
```text
users/{uid}
  ├── uid, email, displayName, department, createdAt

projects/{projectId}
  ├── id, name, description, objectives[], ownerId, startDate, deadline, budget (INR), status
  │
  ├── members/{uid}
  │     └── uid, email, displayName, role ('owner' | 'manager' | 'member' | 'viewer'), joinedAt
  │
  ├── tasks/{taskId}
  │     ├── id, title, description, assigneeId, creatorId, priority, status, dueDate, duration
  │     └── comments/{commentId}
  │           └── id, authorId, authorName, content, createdAt
  │
  ├── expenses/{expenseId}
  │     └── id, description, category, amount (INR), date, creatorId, notes
  │
  └── activity/{activityId}
        └── id, actorId, actorName, type, summary, timestamp
```

#### 4.3 Security & Permission Model
Every database operation is guarded by declarative Firestore rules:
- **Authentication Guarantee:** Anonymous or unverified requests are rejected.
- **Membership Verification:** A user cannot query or read any project subcollection unless an explicit membership record exists under `projects/{projectId}/members/{request.auth.uid}`.
- **Least-Privilege Mutation:** Members can only update the `status` and `notes` fields of tasks explicitly assigned to them.
- **Cascade Deletion:** Project deletion is restricted to the verified Project Owner and cleans all child subcollections in batch commits to prevent orphaned database records.

---

### 5. Implementation Details

#### 5.1 Project & Deliverable Lifecycle
1. When a user creates a project, the client executes a Firestore write batch creating the project document, creating the owner membership document, and logging the initial audit record atomically.
2. The owner adds registered team members by email. The lookup queries the `users` index, verifying the user's existence and assigning a role.
3. Tasks can be visualized both in tabular list views and drag-responsive Kanban column layouts (To Do, In Progress, Blocked, Completed).
4. Deliverables overdue relative to current local time are dynamically tagged with warning indicators unless marked completed.

#### 5.2 Critical Path Method (CPM / PERT) Algorithm
The academic CPM engine implemented in `src/lib/academic-tools.ts` executes in five algorithmic stages:
1. **DAG Cycle Verification:** Performs Depth-First Search (DFS) three-color graph coloring (unvisited, visiting, visited). If a back-edge is encountered, it rejects the network with the exact circular path identified.
2. **Topological Sort:** Computes in-degrees for all activity nodes and sorts them using Kahn's algorithm.
3. **Forward Pass:** Computes Early Start ($ES$) and Early Finish ($EF$):
   $$ES_i = \max_{p \in \text{Pred}(i)}(EF_p), \quad EF_i = ES_i + D_i$$
4. **Backward Pass:** Computes Late Finish ($LF$) and Late Start ($LS$) in reverse topological order:
   $$LF_i = \min_{s \in \text{Succ}(i)}(LS_s), \quad LS_i = LF_i - D_i$$
5. **Total Float & Critical Path:** Calculates slack $\text{Slack}_i = LS_i - ES_i$. Nodes with $\text{Slack} = 0$ are designated as critical.

#### 5.3 Expected Monetary Value (EMV) Decision Engine
The EMV calculator evaluates decision alternatives under probabilistic conditions:
$$\text{EMV}_i = \sum_{j=1}^{m} (P_{ij} \times V_{ij})$$
The system validates that outcome probabilities satisfy $\sum P_j = 1.0 \pm 0.01$ and recommends the alternative offering maximum net payoff in INR.

---

### 6. Testing, Verification & Results
- **Type Safety & Compilation:** Verified clean with TypeScript `tsc --noEmit`.
- **Linting & Best Practices:** Verified with Next.js ESLint configuration yielding 0 errors and 0 warnings.
- **Production Build:** Verified with Turbopack next build producing optimized static and dynamic route manifests.
- **Isolated Development Demo Mode:** Successfully validates UI flows, permission boundaries, and calculations even before production Firebase keys are deployed.

---

### 7. Limitations & Future Scope
- **Real-Time Push Notifications:** Current updates use Firestore listener patterns; future iterations could incorporate Web Push service workers for mobile notifications.
- **Automated BOM Integration:** Integration with vendor APIs (e.g., DigiKey, Mouser) for real-time electronic component pricing updates.
- **Gantt Chart Interactive Dragging:** Expanding the CPM network analyzer with SVG timeline drag-and-drop dependencies.

---

### 8. Conclusion
TeamTask fulfills all requirements stipulated in the KTU PBMET504 course for engineering project planning, multi-user delegation, and monitoring. By marrying strict database security rules with an intuitive, pitch-black engineering user interface, the system bridges the gap between academic management theory and real-world software engineering practice.
