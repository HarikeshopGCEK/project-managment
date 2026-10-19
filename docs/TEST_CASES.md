# TeamTask — Comprehensive Functional & Authorization Test Cases
**Course:** KTU PBMET504 Management for Engineers (2024 Scheme)  
**System:** TeamTask — Engineering Project Planning and Monitoring Platform  
**Target:** Client Application, Firestore Security Rules, and RBAC Enforcement  

---

## 1. Overview and Test Strategy

This document specifies the validation suite for the **TeamTask** engineering operations platform. It covers:
1. **Authentication & Session Lifecycle**
2. **Project Lifecycle & Multi-User Governance**
3. **Role-Based Access Control (RBAC) Security Boundaries**
4. **Task Allocation, Delegation & Status State Machine**
5. **Project Financials, Cost Control & Variance Detection**
6. **Academic Tools: CPM/PERT Network Analysis & EMV Payoffs**
7. **Cross-Project Capacity & Executive Evaluation Reports**

Each test specifies the **Preconditions**, **Execution Steps**, **Expected Results**, and the **Enforcement Layer** (Client-side vs Firestore Security Rules vs Data Service).

---

## 2. Authentication & Identity Test Cases

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | User Registration with Email/Password | 1. Navigate to `/register`<br>2. Submit valid name, email (`test@eng.ktu.edu`), and password (8+ chars). | User account created in Firebase Auth; user profile synchronized to `users/{uid}` in Firestore with timestamps; redirected to `/dashboard`. | Auth / Firestore | **Passed** |
| **AUTH-02** | Registration Duplicate Prevention | 1. Attempt to register an existing registered email. | Displays user-friendly inline error: *"An account with this email address already exists."* | Auth | **Passed** |
| **AUTH-03** | User Login & Session Persistence | 1. Navigate to `/login`<br>2. Submit valid credentials.<br>3. Refresh page after login. | Authenticated state restored immediately without flashing login screens. Session persists across browser reloads. | Client AuthContext | **Passed** |
| **AUTH-04** | Password Reset Request | 1. Navigate to `/forgot-password`<br>2. Submit registered email address. | Confirmation message displayed that reset email has been dispatched; returns to login. | Auth | **Passed** |
| **AUTH-05** | Isolated Dev Demo Mode Fallback | 1. When `.env.local` contains unpopulated Firebase keys.<br>2. Open application. | System detects missing keys, activates isolated demo banner with prominent notice, and allows switching between predefined engineering personas (Owner, Manager, Member, Viewer). | AuthContext / Config Inspector | **Passed** |
| **AUTH-06** | Profile Information Update | 1. Navigate to `/profile`<br>2. Edit display name or department and submit. | Local profile and Firestore `users/{uid}` document updated with `updatedAt` ISO timestamp. | Firestore Client | **Passed** |

---

## 3. Multi-User Project Management Test Cases

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PROJ-01** | Create Project with Dynamic Charter | 1. Navigate to `/projects/new`<br>2. Input Name, Description, Start Date, Deadline, Estimated Budget (₹), and dynamic Objectives list.<br>3. Submit form. | Project written to `projects/{id}`; creator automatically designated as `owner` in `projects/{id}/members/{uid}`; audit log generated; redirects to `/projects/{id}`. | Data Service / Firestore | **Passed** |
| **PROJ-02** | Unauthorized Project Isolation | 1. User B logs in.<br>2. Attempts to browse `/projects/{id}` for a project where User B is not an authorized member. | Access denied or project excluded from user's project catalog; Firestore Security Rule `isProjectMember(projectId)` blocks direct read. | Firestore Rules | **Passed** |
| **PROJ-03** | Project Metadata Modification | 1. As Project Owner or Manager, navigate to `/projects/[id]/settings`<br>2. Modify title, description, or status (e.g. from *Active* to *On Hold*). | Updates committed to Firestore; changes immediately reflected across dashboard and project overview. | Data Service / Firestore | **Passed** |
| **PROJ-04** | Project Ownership Transfer | 1. As Project Owner, select an existing active member from the transfer dropdown.<br>2. Confirm transfer with warning dialog. | Selected member elevated to `owner`; former owner role set to `manager`; logged in activity feed. | Data Service / Firestore Rules | **Passed** |
| **PROJ-05** | Cascade Project Deletion | 1. As Project Owner, type exact project name to confirm deletion.<br>2. Confirm deletion. | Project document, sub-collection tasks, expenses, comments, and member associations cleaned up atomically; redirects to `/projects`. | Data Service / Firestore | **Passed** |

---

## 4. Role-Based Access Control (RBAC) Authorization Matrix

| Action / Capability | Owner | Manager | Member | Viewer | Security Rule Enforced |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **View Project Overview, Tasks & Budget** | Yes | Yes | Yes | Yes | `isProjectMember(projectId)` |
| **Create New Tasks** | Yes | Yes | No | No | `isProjectManagerOrOwner(projectId)` |
| **Assign / Reassign Tasks to Members** | Yes | Yes | No | No | `isProjectManagerOrOwner(projectId)` |
| **Update Own Assigned Task Status (Todo -> Done)** | Yes | Yes | Yes | No | `isAssignee(resource) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', ...])` |
| **Delete Project Tasks** | Yes | Yes | No | No | `isProjectManagerOrOwner(projectId)` |
| **Add Registered Member by Email** | Yes | Yes | No | No | `isProjectManagerOrOwner(projectId)` |
| **Change Member Roles (Member <-> Manager)** | Yes | No | No | No | `isProjectOwner(projectId)` |
| **Remove Project Member** | Yes | No | No | No | `isProjectOwner(projectId)` |
| **Record Project Expenses (INR)** | Yes | Yes | No | No | `isProjectManagerOrOwner(projectId)` |
| **Delete Expense Records** | Yes | No | No | No | `isProjectOwner(projectId)` |
| **Post Comments on Task Discussions** | Yes | Yes | Yes | No | `isProjectMember(projectId)` |
| **Transfer Project Ownership** | Yes | No | No | No | `isProjectOwner(projectId)` |
| **Cascade Delete Entire Project** | Yes | No | No | No | `isProjectOwner(projectId)` |

### Authorization Boundary Test Scenarios:

| ID | Title | Test Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RBAC-01** | Member Task Mutation Restriction | Logged in as `Member` (`Siddharth Rao`), attempt to edit task title, assigned member, or delete a task assigned to someone else. | Action controls disabled in UI; if invoked via direct API request, Firestore Security Rule rejects write with `Permission Denied`. | **Passed** |
| **RBAC-02** | Member Updating Own Assigned Task | Logged in as `Member`, update status of own assigned task from `In Progress` to `Completed`. | Permitted and saved successfully; project completion percentage increments; audit log records completion. | **Passed** |
| **RBAC-03** | Viewer Read-Only Enforcement | Logged in as `Viewer` (`Dr. Thomas Kurian`), inspect projects, tasks, expenses, and team tabs. | All "Add Task", "Add Member", "Record Expense", and role-changing controls are hidden; all direct modifications are blocked. | **Passed** |
| **RBAC-04** | Manager Role Elevation Prevention | Logged in as `Manager` (`Anjali Menon`), attempt to promote self or another member to `Owner`. | Action forbidden; only existing `Owner` has permission to transfer ownership. | **Passed** |

---

## 5. Task Management & Work Breakdown Structure (WBS)

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-01** | Create Task with WBS Attributes | 1. Open `/projects/[id]/tasks`<br>2. Fill in Title, Description, Priority (`Critical`), Assignee, Start Date, Due Date, and Estimated Duration (Days).<br>3. Save task. | Task saved in `projects/{id}/tasks/{taskId}`; appears in task table and Kanban board; activity log generated. | Data Service | **Passed** |
| **TASK-02** | Filter & Search Tasks | 1. Apply Priority filter (`High`, `Critical`), Status filter (`In Progress`), or search query. | Task listing dynamically updates client-side without re-fetching entire collection. | Client UI | **Passed** |
| **TASK-03** | Kanban View Board & Column Rendering | 1. Toggle view switch to Kanban.<br>2. Check column counts for `Todo`, `In Progress`, `Blocked`, and `Completed`. | Tasks correctly sorted into status columns; priority badges rendered; overdue warnings highlighted with amber/red borders. | Client UI | **Passed** |
| **TASK-04** | Overdue Deadline Detection | 1. View task with `dueDate < today` and status != `completed`. | Highlighted with red warning tag and alert icon; included in Dashboard "Overdue Tasks" KPI card. | Client UI / Calculations | **Passed** |
| **TASK-05** | Task Comment Threading | 1. Click "Comments" on task row.<br>2. Post note on technical roadblock.<br>3. Check comment list. | Comment stored in `projects/{id}/tasks/{taskId}/comments`; author name, timestamp, and text rendered in order. | Firestore Subcollection | **Passed** |
| **TASK-06** | My Tasks Aggregated View | 1. Navigate to `/my-tasks`. | Displays all tasks across all projects assigned to current user, grouped by status with 1-click status advancement. | Cross-project query | **Passed** |

---

## 6. Financial Ledger & Cost Variance Test Cases

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EXP-01** | Record Project Expenditure in INR | 1. Navigate to `/expenses`<br>2. Select project, enter description ("LiDAR Sensor Unit"), Category ("Hardware"), and Amount (₹48,000).<br>3. Save expense. | Expense added to ledger; total actual expenses increased; formatted as Indian Rupee (`₹48,000`). | Data Service / Utils | **Passed** |
| **EXP-02** | Budget Remaining & Utilization Calculation | 1. Given Estimated Budget = ₹2,50,000 and Actual Expenses = ₹1,75,000.<br>2. Check budget utilization card. | Remaining Budget = ₹75,000 (30.0% remaining); Utilization = 70.0%; progress bar rendered blue. | Calculations | **Passed** |
| **EXP-03** | Budget Overrun Warning Trigger | 1. Record expenses exceeding the project's estimated budget (e.g. ₹2,65,000 on ₹2,50,000 budget). | Overrun warning banner rendered in amber/red; utilization indicates 106.0%; negative remaining budget flagged clearly. | UI / Validation | **Passed** |
| **EXP-04** | Category Breakdown Analysis | 1. Record expenses across Hardware, Software, Field Testing, and Labor. | Visual distribution bar and summary table display exact expenditure and percentage share per category. | Client UI | **Passed** |

---

## 7. Academic Tools Test Cases (KTU PBMET504)

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CPM-01** | Forward Pass (Earliest Times) | 1. Define activities A (3 days, no pred), B (4 days, pred: A), C (2 days, pred: A).<br>2. Run CPM Analysis. | $ES_A = 0, EF_A = 3$; $ES_B = 3, EF_B = 7$; $ES_C = 3, EF_C = 5$. Total project duration = 7 days. | `academic-tools.ts` | **Passed** |
| **CPM-02** | Backward Pass & Slack Calculation | 1. Run backward pass on above network. | $LF_B = 7, LS_B = 3, Slack_B = 0$; $LF_C = 7, LS_C = 5, Slack_C = 2$. | `academic-tools.ts` | **Passed** |
| **CPM-03** | Critical Path Identification | 1. Check highlighted critical path activities. | Path `A -> B` identified with zero slack ($Slack = 0$); highlighted with red/amber badges. | `academic-tools.ts` | **Passed** |
| **CPM-04** | Dependency Cycle Detection (DAG Validation) | 1. Introduce circular dependency: Activity X depends on Y, Y depends on X.<br>2. Click Run Analysis. | Cycle detected by depth-first search; calculation aborted with clear error: *"Dependency cycle detected involving activity X"*. | Graph DFS Engine | **Passed** |
| **CPM-05** | EMV Payoff Matrix Calculation | 1. Define Alternative 1 with Outcomes (High demand: P=0.6, Payoff=₹1,50,000; Low demand: P=0.4, Payoff=-₹30,000).<br>2. Define Alternative 2.<br>3. Run EMV Calculator. | $EMV_1 = (0.6 \times 150000) + (0.4 \times -30000) = ₹78,000$. Optimal decision alternative highlighted. | `academic-tools.ts` | **Passed** |
| **CPM-06** | EMV Probability Normalization Check | 1. Input outcome probabilities that do not sum to 1.0 (e.g. 0.4 and 0.4). | Warning banner warns user that $\sum P_i = 0.80 \neq 1.00$. | Validation Engine | **Passed** |

---

## 8. Reports & Capacity Planning Test Cases

| ID | Title | Description / Steps | Expected Result | Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REP-01** | Executive Project Report Generation | 1. Navigate to `/reports`<br>2. Select project and period.<br>3. Inspect generated metrics. | Summary cards display Task Completion Rate, Budget Variance, Overdue Count, Member Workload, and Category Expense Breakdown. | Client Analytics | **Passed** |
| **REP-02** | Print-Friendly Layout (CSS `@media print`) | 1. Click "Print / Save PDF" button on reports page. | Browser print dialog triggered; dark sidebar and top navigation bars are hidden; report content reflows into clean black-and-white academic print layout. | `globals.css` Print Styles | **Passed** |
| **REP-03** | Cross-Project Human Resource Workload | 1. Navigate to `/team`<br>2. Review member capacity table. | Aggregates assigned, completed, pending, and overdue tasks across all mutual projects for each engineer. | Data Service | **Passed** |

---

## 9. Feature Implementation Status Matrix

### Implemented & Verified in Build
- [x] Firebase Client & Configuration Diagnostics (`firebase-config.ts`, `firebase.ts`)
- [x] Firebase Authentication (Email/Password, Session state, Friendly errors)
- [x] Isolated Development Demo Mode with 4 Role Personas & realistic KTU capstone projects
- [x] Cloud Firestore Schema & Types (`users`, `projects`, `members`, `tasks`, `expenses`, `activity`, `comments`)
- [x] Production Firestore Security Rules (`firestore.rules`) with granular RBAC enforcement
- [x] Composite Index Definitions (`firestore.indexes.json`)
- [x] Project Charter Management (Creation, Update, Cascade Delete, Ownership Transfer)
- [x] Member Onboarding & Role Governance (Owner, Manager, Member, Viewer)
- [x] Task Management with Table View, Kanban Board, Priority/Status filtering, and Comments
- [x] My Tasks personal view with quick status progression
- [x] Financial Ledger with INR formatting, category breakdown, and overrun warnings
- [x] Operations Console Dashboard with real-time KPI metrics, progress bars, and audit trail
- [x] Critical Path Method (CPM/PERT) Engine with Topological Sort and Cycle Detection
- [x] Expected Monetary Value (EMV) Decision Matrix Engine
- [x] Academic Evaluation Report with CSS Print formatting
- [x] Pitch-black Operations Console Design System (`#050608` canvas, `#142B52` navy accents)

### Proposed Future Enhancements (Post-PBL Phase)
- [ ] Direct SendGrid / Firebase Extensions email notification dispatch for project invitations.
- [ ] Push notifications using Firebase Cloud Messaging (FCM) for urgent task deadline reminders.
- [ ] Drag-and-drop interactive Gantt timeline visualizer with real-time dependency rescheduling.
- [ ] PDF document binary streaming using `@react-pdf/renderer` or server-side Puppeteer export.
