# TeamTask — Engineering Project Planning and Monitoring System

**Course:** KTU PBMET504 Management for Engineers (2024 Scheme)  
**Architecture:** Next.js (App Router), TypeScript, Tailwind CSS, Cloud Firestore, Firebase Authentication  
**Aesthetic:** Pitch-Black & Operations Navy Blue Dark Theme

---

## 1. Project Overview & Problem Statement

Engineering capstone projects, research programs, and industrial initiatives fail predominantly due to disjointed communication, informal task delegation, uncalibrated deadline slips, and unmonitored expenditure deviations. 

**TeamTask** is a production-grade, multi-user web application designed to demonstrate the four pillars of engineering management defined in the **APJ Abdul Kalam Technological University (KTU) PBMET504 syllabus**:
1. **Planning & Organizing (Module 1 & 3):** Work breakdown structures (WBS), project charter creation, measurable deliverables, scheduling, and Critical Path Method (CPM) network analysis.
2. **Leadership & Human Resource Management (Module 3 & 4):** Responsibility assignment matrix (RACI), role-based permissions (Owner, Manager, Member, Viewer), and engineer capacity/workload tracking.
3. **Controlling & Variance Analysis (Module 4):** Milestone tracking, bottleneck identification, planned vs. actual timeline monitoring, and INR expenditure control against budgetary caps.
4. **Decision Theory (Module 2):** Expected Monetary Value (EMV) decision payoff evaluation under risk and uncertainty.

---

## 2. Visual Design System

The application strictly implements an engineering operations console design language:
- **Main Canvas:** `#050608` (Pitch black)
- **Sidebar & Panels:** `#080B12`
- **Cards & Containers:** `#0B0F18`
- **Elevated Surfaces:** `#101725`
- **Primary Navy Blue:** `#142B52`
- **Secondary Vivid Blue:** `#1D4ED8`
- **Interactive Hover Blue:** `#2563EB`
- **Typography:** Geist / Inter with mono accents for metrics and currencies
- **Data Tables & Charts:** High-contrast, restrained border lines (`#1B2434`), zero flashy neon glow, fully accessible text contrast.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router with Server & Client components)
- **Language:** TypeScript 5 (Strict type safety)
- **Styling:** Tailwind CSS v4 & Custom Engineering CSS tokens
- **Icons:** Lucide React
- **Validation:** Zod & React Hook Form
- **Database & Identity:** Cloud Firestore & Firebase Authentication
- **Security:** Granular Firestore Security Rules (`firestore.rules`) and Composite Index definitions (`firestore.indexes.json`)

---

## 4. Firebase Setup & Configuration Instructions

The project is structured to work seamlessly in an **Isolated Development Demo Mode** when credentials are empty in `.env.local`, and transition automatically to live **Firebase Authentication and Cloud Firestore** once credentials are provided, **without any code modifications**.

### Step 1: Populate `.env.local`

Locate `.env.local` in the project root alongside `package.json` (created automatically with empty placeholders). Fill in your 6 web app values:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

#### Where to Find These Values in the Firebase Console:
1. Open the [Firebase Console](https://console.firebase.google.com/) and open your project.
2. Click the **Gear Icon** (Project Settings) > **General** tab.
3. Scroll down to the **Your apps** section.
4. If you have not created a Web App, click the **Web icon (`</>`)**, enter `TeamTask Web`, and register the app.
5. In the **SDK setup and configuration** radio button, select **Config**.
6. Copy the values into `.env.local`.

### Step 2: Enable Firebase Authentication
1. In Firebase Console, go to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password** and toggle **Enable**.
4. (Optional) Enable **Google Sign-In** with your support email.

### Step 3: Enable Cloud Firestore
1. In Firebase Console, go to **Build > Firestore Database**.
2. Click **Create database**.
3. Select your preferred Cloud location (e.g., `asia-south1` for Mumbai).
4. Start in **Production mode**.

### Step 4: Deploy Firestore Security Rules & Indexes
Install the Firebase CLI and deploy the included production rules:
```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Development Demo Mode

When `.env.local` contains empty placeholders:
- The app displays a top alert banner indicating **Development Demo Mode Active**.
- State is managed via an isolated local storage store pre-seeded with KTU Engineering Capstone projects (e.g. *Autonomous Drone Navigation System*, *IoT Smart Microgrid*, *Smart Water Network*).
- An interactive **Role Persona Switcher** in the banner and profile allows immediate role toggling between:
  - **Rahul Nair:** Project Owner
  - **Anjali Menon:** Project Manager
  - **Siddharth Rao:** Engineering Member
  - **Dr. Thomas Kurian:** Academic Faculty Advisor (Viewer)
- **Production Guard:** Demo mode is strictly disabled in production builds (`NODE_ENV === 'production'`) and will never silently mock writes.

---

## 6. Authorization & Role-Based Permissions

| Capability | Owner | Manager | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create New Projects | ✅ | ✅ | ✅ | ✅ |
| Modify Project Metadata & Budget | ✅ | ✅ | ❌ | ❌ |
| Transfer Project Ownership | ✅ | ❌ | ❌ | ❌ |
| Delete Project & Multi-Doc Cleanup | ✅ | ❌ | ❌ | ❌ |
| Add Members by Email | ✅ | ✅ | ❌ | ❌ |
| Change Member Roles | ✅ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ | ❌ |
| Create & Reassign Tasks | ✅ | ✅ | ❌ | ❌ |
| Update Status of Assigned Tasks | ✅ | ✅ | ✅ | ❌ |
| Record & Delete Expenses (INR) | ✅ | ✅ | ❌ | ❌ |
| Post Task Comments | ✅ | ✅ | ✅ | ❌ |
| View Reports & Analytics | ✅ | ✅ | ✅ | ✅ |

---

## 7. Mathematical & Management Calculation Formulas

### 1. Deliverable Completion Percentage
$$\text{Completion Rate} = \frac{\text{Completed Tasks}}{\text{Total Project Tasks}} \times 100$$
*(If total tasks = 0, returns 0%).*

### 2. Budget Utilization & Remaining Variance
$$\text{Budget Remaining (INR)} = \text{Estimated Budget} - \sum \text{Actual Expenses}$$
$$\text{Budget Utilization (\%)} = \frac{\sum \text{Actual Expenses}}{\text{Estimated Budget}} \times 100$$

### 3. Critical Path Method (CPM / PERT) Network
- **Forward Pass:** 
  $$\text{ES}_i = \max(\text{EF}_{\text{predecessors}}), \quad \text{EF}_i = \text{ES}_i + \text{Duration}_i$$
- **Backward Pass:**
  $$\text{LF}_i = \min(\text{LS}_{\text{successors}}), \quad \text{LS}_i = \text{LF}_i - \text{Duration}_i$$
- **Total Float (Slack):**
  $$\text{Slack}_i = \text{LS}_i - \text{ES}_i = \text{LF}_i - \text{EF}_i$$
- **Critical Path:**
  $$\text{Activities where } \text{Slack}_i = 0$$

### 4. Expected Monetary Value (EMV)
$$\text{EMV} = \sum_{j=1}^{n} (P_j \times V_j)$$
*Where $P_j$ is the probability of outcome $j$ ($\sum P = 1.0$) and $V_j$ is the financial payoff in INR.*

---

## 8. Directory Structure

```text
├── app/
│   ├── academic/page.tsx         # CPM/PERT & EMV decision calculators
│   ├── dashboard/page.tsx        # Personal ops dashboard with KPIs
│   ├── expenses/page.tsx         # INR expense tracker & budget ledger
│   ├── forgot-password/page.tsx  # Password recovery flow
│   ├── globals.css               # Engineering dark theme design tokens
│   ├── layout.tsx                # Root layout with AuthProvider & metadata
│   ├── login/page.tsx            # Login with email/pass, Google & demo roles
│   ├── my-tasks/page.tsx         # Personal delegated deliverable tracking
│   ├── page.tsx                  # Root redirect controller
│   ├── profile/page.tsx          # Profile & Firebase diagnostics
│   ├── projects/
│   │   ├── [projectId]/
│   │   │   ├── page.tsx          # Project overview & milestone summary
│   │   │   ├── settings/page.tsx # Metadata, ownership transfer & delete
│   │   │   ├── tasks/page.tsx    # Table & Kanban view, comments modal
│   │   │   └── team/page.tsx     # Member lookup, role matrix, workloads
│   │   ├── new/page.tsx          # Project charter & objective creation
│   │   └── page.tsx              # Projects catalog with filters & search
│   ├── register/page.tsx         # Registration & Firestore profile sync
│   ├── reports/page.tsx          # Print-ready project evaluation report
│   └── team/page.tsx             # Cross-project HRM workload allocation
├── docs/
│   ├── PROJECT_REPORT.md         # Academic report draft for PBMET504
│   ├── SYLLABUS_MAPPING.md       # Syllabus mapping to KTU 2024 scheme
│   └── TEST_CASES.md             # Functional & authorization test matrix
├── firestore.rules               # Production-grade Firestore Security Rules
├── firestore.indexes.json        # Firestore composite indexes definition
├── src/
│   ├── components/               # Layout, Navigation, Badges, Modals
│   ├── context/                  # AuthContext provider
│   ├── lib/                      # Firebase, Firestore, DataService, CPM/EMV
│   └── types/                    # TypeScript interfaces
└── .env.example                  # Environment template
```

---

## 9. Verification & Commands

```bash
# Typecheck
npx tsc --noEmit

# Lint check
npm run lint

# Production build
npm run build

# Start dev server
npm run dev
```
