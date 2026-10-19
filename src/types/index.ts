export type UserRole = "owner" | "manager" | "member" | "viewer";

export type ProjectStatus = "planned" | "active" | "on_hold" | "completed";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";

export type ExpenseCategory =
  | "Hardware"
  | "Software"
  | "Labor"
  | "Testing"
  | "Travel"
  | "Documentation"
  | "Misc";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  startDate: string;
  deadline: string;
  budget: number; // in INR
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  memberUids?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  creatorId: string;
  creatorName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  estimatedDurationDays: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  projectId: string;
  projectName?: string;
  description: string;
  category: ExpenseCategory;
  amount: number; // in INR
  date: string;
  creatorId: string;
  creatorName: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  projectName?: string;
  actorId: string;
  actorName: string;
  type:
    | "project_created"
    | "member_added"
    | "member_removed"
    | "role_changed"
    | "task_created"
    | "task_assigned"
    | "task_status_updated"
    | "expense_recorded"
    | "project_updated";
  summary: string;
  timestamp: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterEmail: string;
  email: string;
  role: UserRole;
  status: "pending" | "accepted" | "revoked";
  expiresAt: string;
  createdAt: string;
}

// Academic PBMET504 Management Decision Tools Types
export interface EMVOutcome {
  id: string;
  name: string;
  probability: number; // between 0 and 1
  payoff: number; // in INR
}

export interface EMVAlternative {
  id: string;
  name: string;
  description?: string;
  outcomes: EMVOutcome[];
}

export interface CPMActivity {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  predecessors: string[]; // array of activity codes
  es?: number; // Earliest Start
  ef?: number; // Earliest Finish
  ls?: number; // Latest Start
  lf?: number; // Latest Finish
  slack?: number; // Total Float
  isCritical?: boolean;
}
