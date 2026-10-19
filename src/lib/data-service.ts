import { isFirebaseConfigured, isDemoModeActive } from "./firebase-config";
import * as firestoreLib from "./firestore";
import {
  DEMO_USERS,
  INITIAL_DEMO_PROJECTS,
  INITIAL_DEMO_MEMBERS,
  INITIAL_DEMO_TASKS,
  INITIAL_DEMO_EXPENSES,
  INITIAL_DEMO_ACTIVITY,
  INITIAL_DEMO_COMMENTS,
} from "./demo-data";
import type {
  Project,
  ProjectMember,
  Task,
  TaskComment,
  Expense,
  ActivityLog,
  UserProfile,
  UserRole,
} from "@/src/types";

// ========================================================
// DEMO STORE (Isolated Local Storage / In-Memory for Dev)
// ========================================================

const STORAGE_KEYS = {
  PROJECTS: "teamtask_demo_projects",
  MEMBERS: "teamtask_demo_members",
  TASKS: "teamtask_demo_tasks",
  EXPENSES: "teamtask_demo_expenses",
  ACTIVITIES: "teamtask_demo_activities",
  COMMENTS: "teamtask_demo_comments",
  ACTIVE_USER: "teamtask_demo_active_user",
};

function getFromStorage<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

// Reset or initialize demo store
export function resetDemoStore(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_DEMO_PROJECTS));
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_DEMO_MEMBERS));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_DEMO_TASKS));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_DEMO_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_DEMO_ACTIVITY));
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_DEMO_COMMENTS));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(DEMO_USERS[0]));
}

// Ensure demo data is initialized in localStorage
function ensureDemoStoreInitialized(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    resetDemoStore();
  }
}

// ========================================================
// ACTIVE USER IN DEMO MODE
// ========================================================

export function getDemoActiveUser(): UserProfile {
  ensureDemoStoreInitialized();
  return getFromStorage<UserProfile>(STORAGE_KEYS.ACTIVE_USER, DEMO_USERS[0]);
}

export function setDemoActiveUser(user: UserProfile): void {
  saveToStorage(STORAGE_KEYS.ACTIVE_USER, user);
}

// ========================================================
// UNIFIED DATA SERVICE API
// ========================================================

export async function getProjects(currentUserUid?: string): Promise<Project[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProjects(currentUserUid);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_DEMO_PROJECTS);
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );

    if (!currentUserUid) return projects;

    // Filter projects where current user is owner or member
    return projects.filter((p) => {
      if (p.ownerId === currentUserUid) return true;
      const mems = membersMap[p.id] || [];
      return mems.some((m) => m.uid === currentUserUid);
    });
  }

  throw new Error("Application backend not configured. Missing Firebase credentials in production.");
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProject(projectId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_DEMO_PROJECTS);
    return projects.find((p) => p.id === projectId) || null;
  }

  return null;
}

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">,
  owner: UserProfile
): Promise<Project> {
  if (isFirebaseConfigured()) {
    return firestoreLib.createFirestoreProject(data, owner);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_DEMO_PROJECTS);
    projects.unshift(newProject);
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);

    // Add owner to members
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    membersMap[newProject.id] = [
      {
        uid: owner.uid,
        email: owner.email,
        displayName: owner.displayName,
        role: "owner",
        joinedAt: now,
      },
    ];
    saveToStorage(STORAGE_KEYS.MEMBERS, membersMap);

    // Log activity
    await logActivity({
      projectId: newProject.id,
      actorId: owner.uid,
      actorName: owner.displayName,
      type: "project_created",
      summary: `Project "${newProject.name}" was created by ${owner.displayName}.`,
    });

    return newProject;
  }

  throw new Error("Cannot create project without database configuration.");
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>,
  actor: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.updateFirestoreProject(projectId, updates);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_DEMO_PROJECTS);
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx !== -1) {
      projects[idx] = {
        ...projects[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.PROJECTS, projects);

      await logActivity({
        projectId,
        actorId: actor.uid,
        actorName: actor.displayName,
        type: "project_updated",
        summary: `Project details updated by ${actor.displayName}.`,
      });
    }
    return;
  }

  throw new Error("Cannot update project without database configuration.");
}

export async function deleteProject(projectId: string, actor?: UserProfile): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.deleteFirestoreProject(projectId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    if (actor) {
      console.info(`Project ${projectId} deleted by ${actor.displayName}`);
    }
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_DEMO_PROJECTS);
    saveToStorage(
      STORAGE_KEYS.PROJECTS,
      projects.filter((p) => p.id !== projectId)
    );

    // Delete members
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    delete membersMap[projectId];
    saveToStorage(STORAGE_KEYS.MEMBERS, membersMap);

    // Delete tasks
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    saveToStorage(
      STORAGE_KEYS.TASKS,
      tasks.filter((t) => t.projectId !== projectId)
    );

    // Delete expenses
    const expenses = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
    saveToStorage(
      STORAGE_KEYS.EXPENSES,
      expenses.filter((e) => e.projectId !== projectId)
    );

    return;
  }

  throw new Error("Cannot delete project without database configuration.");
}

// ========================================================
// MEMBERSHIP & ROLES
// ========================================================

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProjectMembers(projectId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    return membersMap[projectId] || [];
  }

  return [];
}

export async function getUserProjectRole(
  projectId: string,
  userUid: string
): Promise<UserRole | null> {
  const members = await getProjectMembers(projectId);
  const found = members.find((m) => m.uid === userUid);
  return found ? found.role : null;
}

export async function addProjectMember(
  projectId: string,
  email: string,
  role: UserRole,
  actor: UserProfile
): Promise<ProjectMember> {
  if (isFirebaseConfigured()) {
    const userProfile = await firestoreLib.lookupUserByEmail(email);
    if (!userProfile) {
      throw new Error(`No registered user found with email "${email}".`);
    }
    const member: ProjectMember = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      role,
      joinedAt: new Date().toISOString(),
    };
    await firestoreLib.addFirestoreProjectMember(projectId, member, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
    return member;
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = DEMO_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    const displayName = foundUser ? foundUser.displayName : cleanEmail.split("@")[0];
    const uid = foundUser ? foundUser.uid : `demo-uid-${Date.now()}`;

    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    const currentMembers = membersMap[projectId] || [];

    if (currentMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      throw new Error(`User with email "${email}" is already a member of this project.`);
    }

    const newMember: ProjectMember = {
      uid,
      email: cleanEmail,
      displayName,
      role,
      joinedAt: new Date().toISOString(),
    };

    currentMembers.push(newMember);
    membersMap[projectId] = currentMembers;
    saveToStorage(STORAGE_KEYS.MEMBERS, membersMap);

    await logActivity({
      projectId,
      actorId: actor.uid,
      actorName: actor.displayName,
      type: "member_added",
      summary: `${displayName} (${cleanEmail}) was added as ${role}.`,
    });

    return newMember;
  }

  throw new Error("Cannot add project member without database configuration.");
}

export async function updateProjectMemberRole(
  projectId: string,
  targetUid: string,
  targetName: string,
  newRole: UserRole,
  actor: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.updateFirestoreMemberRole(projectId, targetUid, targetName, newRole, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    const members = membersMap[projectId] || [];
    const idx = members.findIndex((m) => m.uid === targetUid);
    if (idx !== -1) {
      members[idx].role = newRole;
      membersMap[projectId] = members;
      saveToStorage(STORAGE_KEYS.MEMBERS, membersMap);

      await logActivity({
        projectId,
        actorId: actor.uid,
        actorName: actor.displayName,
        type: "role_changed",
        summary: `${targetName}'s role changed to ${newRole} by ${actor.displayName}.`,
      });
    }
    return;
  }

  throw new Error("Cannot update member role without database configuration.");
}

export async function removeProjectMember(
  projectId: string,
  targetUid: string,
  targetName: string,
  actor: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.removeFirestoreMember(projectId, targetUid, targetName, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const membersMap = getFromStorage<Record<string, ProjectMember[]>>(
      STORAGE_KEYS.MEMBERS,
      INITIAL_DEMO_MEMBERS
    );
    const members = membersMap[projectId] || [];
    membersMap[projectId] = members.filter((m) => m.uid !== targetUid);
    saveToStorage(STORAGE_KEYS.MEMBERS, membersMap);

    // Unassign tasks from this user in this project
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    tasks.forEach((t) => {
      if (t.projectId === projectId && t.assigneeId === targetUid) {
        delete t.assigneeId;
        delete t.assigneeName;
        delete t.assigneeEmail;
      }
    });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    await logActivity({
      projectId,
      actorId: actor.uid,
      actorName: actor.displayName,
      type: "member_removed",
      summary: `${targetName} was removed from the project by ${actor.displayName}.`,
    });
    return;
  }

  throw new Error("Cannot remove member without database configuration.");
}

// ========================================================
// TASKS
// ========================================================

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProjectTasks(projectId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    return tasks.filter((t) => t.projectId === projectId);
  }

  return [];
}

export async function getUserTasks(userUid: string): Promise<Task[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreUserTasks(userUid);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    return tasks.filter((t) => t.assigneeId === userUid);
  }

  return [];
}

export async function createTask(
  projectId: string,
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  actor: UserProfile
): Promise<Task> {
  if (isFirebaseConfigured()) {
    return firestoreLib.createFirestoreTask(projectId, taskData, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      projectId,
      createdAt: now,
      updatedAt: now,
    };

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    tasks.unshift(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    await logActivity({
      projectId,
      actorId: actor.uid,
      actorName: actor.displayName,
      type: "task_created",
      summary: `Task "${newTask.title}" created (${newTask.priority} priority).`,
    });

    return newTask;
  }

  throw new Error("Cannot create task without database configuration.");
}

export async function updateTask(
  projectId: string,
  taskId: string,
  updates: Partial<Task>,
  actor: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.updateFirestoreTask(projectId, taskId, updates, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const now = new Date().toISOString();
      const updated: Task = {
        ...tasks[idx],
        ...updates,
        updatedAt: now,
      };
      if (updates.status === "completed" && !tasks[idx].completedAt) {
        updated.completedAt = now;
      }
      tasks[idx] = updated;
      saveToStorage(STORAGE_KEYS.TASKS, tasks);

      if (updates.status && updates.status !== tasks[idx].status) {
        await logActivity({
          projectId,
          actorId: actor.uid,
          actorName: actor.displayName,
          type: "task_status_updated",
          summary: `Task "${updated.title}" status changed to ${updates.status} by ${actor.displayName}.`,
        });
      }
    }
    return;
  }

  throw new Error("Cannot update task without database configuration.");
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  actor?: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.deleteFirestoreTask(projectId, taskId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
    saveToStorage(
      STORAGE_KEYS.TASKS,
      tasks.filter((t) => t.id !== taskId)
    );
    if (actor) {
      await logActivity({
        projectId,
        actorId: actor.uid,
        actorName: actor.displayName,
        type: "task_status_updated",
        summary: `Task ${taskId} was deleted by ${actor.displayName}.`,
      });
    }
    return;
  }

  throw new Error("Cannot delete task without database configuration.");
}

// ========================================================
// COMMENTS
// ========================================================

export async function getTaskComments(projectId: string, taskId: string): Promise<TaskComment[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreTaskComments(projectId, taskId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const commentsMap = getFromStorage<Record<string, TaskComment[]>>(
      STORAGE_KEYS.COMMENTS,
      INITIAL_DEMO_COMMENTS
    );
    return commentsMap[taskId] || [];
  }

  return [];
}

export async function addTaskComment(
  projectId: string,
  taskId: string,
  content: string,
  author: UserProfile
): Promise<TaskComment> {
  if (isFirebaseConfigured()) {
    return firestoreLib.addFirestoreTaskComment(projectId, taskId, {
      projectId,
      taskId,
      authorId: author.uid,
      authorName: author.displayName,
      authorEmail: author.email,
      content,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const commentsMap = getFromStorage<Record<string, TaskComment[]>>(
      STORAGE_KEYS.COMMENTS,
      INITIAL_DEMO_COMMENTS
    );
    const currentList = commentsMap[taskId] || [];

    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      taskId,
      projectId,
      authorId: author.uid,
      authorName: author.displayName,
      authorEmail: author.email,
      content,
      createdAt: new Date().toISOString(),
    };

    currentList.push(newComment);
    commentsMap[taskId] = currentList;
    saveToStorage(STORAGE_KEYS.COMMENTS, commentsMap);

    return newComment;
  }

  throw new Error("Cannot add comment without database configuration.");
}

// ========================================================
// EXPENSES & BUDGET
// ========================================================

export async function getExpensesByProject(projectId: string): Promise<Expense[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProjectExpenses(projectId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const expenses = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
    return expenses.filter((e) => e.projectId === projectId);
  }

  return [];
}

export async function getAllExpenses(userUid?: string): Promise<Expense[]> {
  if (isFirebaseConfigured()) {
    return userUid ? firestoreLib.getAllFirestoreExpenses(userUid) : [];
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    return getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
  }

  return [];
}

export async function createExpense(
  projectId: string,
  expenseData: Omit<Expense, "id" | "createdAt">,
  actor: UserProfile
): Promise<Expense> {
  if (isFirebaseConfigured()) {
    return firestoreLib.createFirestoreExpense(projectId, expenseData, {
      uid: actor.uid,
      displayName: actor.displayName,
    });
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString(),
    };

    const expenses = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
    expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);

    await logActivity({
      projectId,
      actorId: actor.uid,
      actorName: actor.displayName,
      type: "expense_recorded",
      summary: `Expense of ₹${newExpense.amount.toLocaleString("en-IN")} recorded under ${newExpense.category}.`,
    });

    return newExpense;
  }

  throw new Error("Cannot record expense without database configuration.");
}

export async function deleteExpense(
  projectId: string,
  expenseId: string,
  actor?: UserProfile
): Promise<void> {
  if (isFirebaseConfigured()) {
    return firestoreLib.deleteFirestoreExpense(projectId, expenseId);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const expenses = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
    saveToStorage(
      STORAGE_KEYS.EXPENSES,
      expenses.filter((e) => e.id !== expenseId)
    );
    if (actor) {
      await logActivity({
        projectId,
        actorId: actor.uid,
        actorName: actor.displayName,
        type: "expense_recorded",
        summary: `Expense ${expenseId} was deleted by ${actor.displayName}.`,
      });
    }
    return;
  }

  throw new Error("Cannot delete expense without database configuration.");
}

// ========================================================
// ACTIVITY FEED
// ========================================================

export async function getProjectActivities(
  projectId: string,
  maxItems = 20
): Promise<ActivityLog[]> {
  if (isFirebaseConfigured()) {
    return firestoreLib.getFirestoreProjectActivities(projectId, maxItems);
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const acts = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_DEMO_ACTIVITY);
    return acts.filter((a) => a.projectId === projectId).slice(0, maxItems);
  }

  return [];
}

export async function getAllRecentActivities(
  maxItems = 20,
  userUid?: string
): Promise<ActivityLog[]> {
  if (isFirebaseConfigured()) {
    return userUid
      ? firestoreLib.getAllFirestoreRecentActivities(userUid, maxItems)
      : [];
  }

  if (isDemoModeActive()) {
    ensureDemoStoreInitialized();
    const acts = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_DEMO_ACTIVITY);
    return acts.slice(0, maxItems);
  }

  return [];
}

export async function logActivity(
  actData: Omit<ActivityLog, "id" | "timestamp">
): Promise<ActivityLog> {
  const newLog: ActivityLog = {
    ...actData,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  if (isDemoModeActive()) {
    const acts = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_DEMO_ACTIVITY);
    acts.unshift(newLog);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, acts);
  }

  return newLog;
}

// ========================================================
// AGGREGATE CALCULATIONS & METRICS
// ========================================================

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  blockedTasks: number;
  completionRate: number; // Percentage
  overdueTasks: number;
  totalBudget: number; // in INR
  totalExpenses: number; // in INR
  budgetRemaining: number;
  budgetUtilization: number; // Percentage
  isOverBudget: boolean;
}

export async function calculateProjectMetrics(projectId: string): Promise<ProjectMetrics> {
  const project = await getProjectById(projectId);
  const tasks = await getTasksByProject(projectId);
  const expenses = await getExpensesByProject(projectId);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

  const now = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && t.dueDate < now
  ).length;

  // Completion calculation: Completed / Total * 100. If 0 tasks, 0%.
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBudget = project?.budget || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const budgetRemaining = totalBudget - totalExpenses;
  const budgetUtilization =
    totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;
  const isOverBudget = totalExpenses > totalBudget;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    blockedTasks,
    completionRate,
    overdueTasks,
    totalBudget,
    totalExpenses,
    budgetRemaining,
    budgetUtilization,
    isOverBudget,
  };
}
