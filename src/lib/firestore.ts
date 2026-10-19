import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import { isFirebaseConfigured } from "./firebase-config";
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

function assertDb() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error(
      "Cloud Firestore is not configured. Populate NEXT_PUBLIC_FIREBASE_* in .env.local"
    );
  }
  return db;
}

// ---------------- USER PROFILES ----------------
export async function getFirestoreUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = assertDb();
  const snap = await getDoc(doc(firestore, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function lookupUserByEmail(email: string): Promise<UserProfile | null> {
  const firestore = assertDb();
  const q = query(
    collection(firestore, "users"),
    where("email", "==", email.toLowerCase().trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

// ---------------- PROJECTS ----------------
export async function createFirestoreProject(
  projectData: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ownerProfile: UserProfile
): Promise<Project> {
  const firestore = assertDb();
  const projectRef = doc(collection(firestore, "projects"));
  const projectId = projectRef.id;

  const now = new Date().toISOString();
  const newProject: Project = {
    ...projectData,
    id: projectId,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(firestore);

  // 1. Create project document
  batch.set(projectRef, {
    ...newProject,
    memberUids: [ownerProfile.uid],
    serverTimestamp: serverTimestamp(),
  });

  // 2. Add owner as member in subcollection projects/{id}/members/{uid}
  const memberRef = doc(firestore, "projects", projectId, "members", ownerProfile.uid);
  const ownerMember: ProjectMember = {
    uid: ownerProfile.uid,
    email: ownerProfile.email,
    displayName: ownerProfile.displayName,
    role: "owner",
    joinedAt: now,
  };
  batch.set(memberRef, ownerMember);

  // 3. Log activity in projects/{id}/activity/{actId}
  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  const initialActivity: ActivityLog = {
    id: actRef.id,
    projectId,
    actorId: ownerProfile.uid,
    actorName: ownerProfile.displayName,
    type: "project_created",
    summary: `Project "${newProject.name}" was created by ${ownerProfile.displayName}.`,
    timestamp: now,
  };
  batch.set(actRef, initialActivity);

  await batch.commit();
  return { ...newProject, memberUids: [ownerProfile.uid] };
}

export async function getFirestoreProject(projectId: string): Promise<Project | null> {
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return null;
  }
  const firestore = assertDb();
  try {
    const snap = await getDoc(doc(firestore, "projects", projectId.trim()));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as Project;
  } catch (err) {
    console.warn(`Error reading project ${projectId}:`, err);
    return null;
  }
}

export async function getFirestoreProjects(userUid?: string): Promise<Project[]> {
  const firestore = assertDb();
  if (!userUid) return [];

  try {
    const [ownerSnap, memberSnap] = await Promise.all([
      getDocs(query(collection(firestore, "projects"), where("ownerId", "==", userUid))),
      getDocs(query(collection(firestore, "projects"), where("memberUids", "array-contains", userUid))),
    ]);

    const projectMap = new Map<string, Project>();
    ownerSnap.docs.forEach((d) => projectMap.set(d.id, { ...d.data(), id: d.id } as Project));
    memberSnap.docs.forEach((d) => projectMap.set(d.id, { ...d.data(), id: d.id } as Project));

    return Array.from(projectMap.values());
  } catch (err) {
    console.warn("Error fetching firestore projects:", err);
    return [];
  }
}

export async function updateFirestoreProject(
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  const firestore = assertDb();
  const projectRef = doc(firestore, "projects", projectId);
  await updateDoc(projectRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFirestoreProject(projectId: string): Promise<void> {
  const firestore = assertDb();
  // To avoid orphaned records, clean subcollections first then delete project doc
  const [membersSnap, tasksSnap, expensesSnap, activitySnap] = await Promise.all([
    getDocs(collection(firestore, "projects", projectId, "members")),
    getDocs(collection(firestore, "projects", projectId, "tasks")),
    getDocs(collection(firestore, "projects", projectId, "expenses")),
    getDocs(collection(firestore, "projects", projectId, "activity")),
  ]);

  const subDocRefs = [
    ...membersSnap.docs.map((d) => d.ref),
    ...tasksSnap.docs.map((d) => d.ref),
    ...expensesSnap.docs.map((d) => d.ref),
    ...activitySnap.docs.map((d) => d.ref),
  ];

  // Batch delete subcollection records in safe chunks (Firestore max is 500 per batch)
  const chunkSize = 400;
  for (let i = 0; i < subDocRefs.length; i += chunkSize) {
    const chunk = subDocRefs.slice(i, i + chunkSize);
    const batch = writeBatch(firestore);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // Finally, delete the root project document
  await deleteDoc(doc(firestore, "projects", projectId));
}

// ---------------- MEMBERS & ROLES ----------------
export async function getFirestoreProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const firestore = assertDb();
  const snap = await getDocs(collection(firestore, "projects", projectId, "members"));
  return snap.docs.map((d) => d.data() as ProjectMember);
}

export async function addFirestoreProjectMember(
  projectId: string,
  member: ProjectMember,
  actor: { uid: string; displayName: string }
): Promise<void> {
  const firestore = assertDb();
  const batch = writeBatch(firestore);

  const memberRef = doc(firestore, "projects", projectId, "members", member.uid);
  batch.set(memberRef, member);

  const projectRef = doc(firestore, "projects", projectId);
  batch.update(projectRef, {
    memberUids: arrayUnion(member.uid),
    updatedAt: new Date().toISOString(),
  });

  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  const activity: ActivityLog = {
    id: actRef.id,
    projectId,
    actorId: actor.uid,
    actorName: actor.displayName,
    type: "member_added",
    summary: `${member.displayName} (${member.email}) was added as ${member.role}.`,
    timestamp: new Date().toISOString(),
  };
  batch.set(actRef, activity);

  await batch.commit();
}

export async function updateFirestoreMemberRole(
  projectId: string,
  targetUid: string,
  targetName: string,
  newRole: UserRole,
  actor: { uid: string; displayName: string }
): Promise<void> {
  const firestore = assertDb();
  const batch = writeBatch(firestore);

  const memberRef = doc(firestore, "projects", projectId, "members", targetUid);
  batch.update(memberRef, { role: newRole });

  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  const activity: ActivityLog = {
    id: actRef.id,
    projectId,
    actorId: actor.uid,
    actorName: actor.displayName,
    type: "role_changed",
    summary: `${targetName}'s role was changed to ${newRole} by ${actor.displayName}.`,
    timestamp: new Date().toISOString(),
  };
  batch.set(actRef, activity);

  await batch.commit();
}

export async function removeFirestoreMember(
  projectId: string,
  targetUid: string,
  targetName: string,
  actor: { uid: string; displayName: string }
): Promise<void> {
  const firestore = assertDb();
  const batch = writeBatch(firestore);

  const memberRef = doc(firestore, "projects", projectId, "members", targetUid);
  batch.delete(memberRef);

  const projectRef = doc(firestore, "projects", projectId);
  batch.update(projectRef, {
    memberUids: arrayRemove(targetUid),
    updatedAt: new Date().toISOString(),
  });

  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  const activity: ActivityLog = {
    id: actRef.id,
    projectId,
    actorId: actor.uid,
    actorName: actor.displayName,
    type: "member_removed",
    summary: `${targetName} was removed from the project by ${actor.displayName}.`,
    timestamp: new Date().toISOString(),
  };
  batch.set(actRef, activity);

  await batch.commit();
}

// ---------------- TASKS ----------------
export async function getFirestoreProjectTasks(projectId: string): Promise<Task[]> {
  const firestore = assertDb();
  const q = query(collection(firestore, "projects", projectId, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export async function createFirestoreTask(
  projectId: string,
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  actor: { uid: string; displayName: string }
): Promise<Task> {
  const firestore = assertDb();
  const taskRef = doc(collection(firestore, "projects", projectId, "tasks"));
  const now = new Date().toISOString();

  const newTask: Task = {
    ...taskData,
    id: taskRef.id,
    projectId,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(firestore);
  batch.set(taskRef, newTask);

  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  const act: ActivityLog = {
    id: actRef.id,
    projectId,
    actorId: actor.uid,
    actorName: actor.displayName,
    type: "task_created",
    summary: `Task "${newTask.title}" created (${newTask.priority} priority).`,
    timestamp: now,
  };
  batch.set(actRef, act);

  await batch.commit();
  return newTask;
}

export async function updateFirestoreTask(
  projectId: string,
  taskId: string,
  updates: Partial<Task>,
  actor: { uid: string; displayName: string }
): Promise<void> {
  const firestore = assertDb();
  const taskRef = doc(firestore, "projects", projectId, "tasks", taskId);
  const now = new Date().toISOString();

  const finalUpdates: Partial<Task> = {
    ...updates,
    updatedAt: now,
  };
  if (updates.status === "completed" && !updates.completedAt) {
    finalUpdates.completedAt = now;
  }

  const batch = writeBatch(firestore);
  batch.update(taskRef, finalUpdates);

  if (updates.status) {
    const actRef = doc(collection(firestore, "projects", projectId, "activity"));
    batch.set(actRef, {
      id: actRef.id,
      projectId,
      actorId: actor.uid,
      actorName: actor.displayName,
      type: "task_status_updated",
      summary: `Task status updated to ${updates.status} by ${actor.displayName}.`,
      timestamp: now,
    } as ActivityLog);
  }

  await batch.commit();
}

export async function deleteFirestoreTask(projectId: string, taskId: string): Promise<void> {
  const firestore = assertDb();
  await deleteDoc(doc(firestore, "projects", projectId, "tasks", taskId));
}

// ---------------- TASK COMMENTS ----------------
export async function getFirestoreTaskComments(
  projectId: string,
  taskId: string
): Promise<TaskComment[]> {
  const firestore = assertDb();
  const q = query(
    collection(firestore, "projects", projectId, "tasks", taskId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TaskComment);
}

export async function addFirestoreTaskComment(
  projectId: string,
  taskId: string,
  comment: Omit<TaskComment, "id" | "createdAt">
): Promise<TaskComment> {
  const firestore = assertDb();
  const commentRef = doc(
    collection(firestore, "projects", projectId, "tasks", taskId, "comments")
  );
  const now = new Date().toISOString();
  const newComment: TaskComment = {
    ...comment,
    id: commentRef.id,
    createdAt: now,
  };
  await setDoc(commentRef, newComment);
  return newComment;
}

// ---------------- EXPENSES ----------------
export async function getFirestoreProjectExpenses(projectId: string): Promise<Expense[]> {
  const firestore = assertDb();
  const q = query(
    collection(firestore, "projects", projectId, "expenses"),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Expense);
}

export async function createFirestoreExpense(
  projectId: string,
  expenseData: Omit<Expense, "id" | "createdAt">,
  actor: { uid: string; displayName: string }
): Promise<Expense> {
  const firestore = assertDb();
  const expRef = doc(collection(firestore, "projects", projectId, "expenses"));
  const now = new Date().toISOString();
  const newExpense: Expense = {
    ...expenseData,
    id: expRef.id,
    projectId,
    createdAt: now,
  };

  const batch = writeBatch(firestore);
  batch.set(expRef, newExpense);

  const actRef = doc(collection(firestore, "projects", projectId, "activity"));
  batch.set(actRef, {
    id: actRef.id,
    projectId,
    actorId: actor.uid,
    actorName: actor.displayName,
    type: "expense_recorded",
    summary: `Expense of ₹${newExpense.amount.toLocaleString("en-IN")} recorded under ${newExpense.category}.`,
    timestamp: now,
  } as ActivityLog);

  await batch.commit();
  return newExpense;
}

export async function deleteFirestoreExpense(projectId: string, expenseId: string): Promise<void> {
  const firestore = assertDb();
  await deleteDoc(doc(firestore, "projects", projectId, "expenses", expenseId));
}

// ---------------- ACTIVITY LOGS ----------------
export async function getFirestoreProjectActivities(
  projectId: string,
  maxItems = 25
): Promise<ActivityLog[]> {
  const firestore = assertDb();
  const q = query(
    collection(firestore, "projects", projectId, "activity"),
    orderBy("timestamp", "desc"),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ActivityLog);
}

// ---------------- CROSS-PROJECT QUERIES ----------------
export async function getFirestoreUserTasks(userUid: string): Promise<Task[]> {
  if (!userUid) return [];
  const firestore = assertDb();
  try {
    const q = query(
      collectionGroup(firestore, "tasks"),
      where("assigneeId", "==", userUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Task));
  } catch {
    // If collectionGroup is not yet indexed, query tasks across user's authorized projects
    try {
      const projects = await getFirestoreProjects(userUid);
      const lists = await Promise.all(projects.map((p) => getFirestoreProjectTasks(p.id)));
      return lists.flat().filter((t) => t.assigneeId === userUid);
    } catch {
      return [];
    }
  }
}

export async function getAllFirestoreExpenses(userUid: string): Promise<Expense[]> {
  if (!userUid) return [];
  try {
    const projects = await getFirestoreProjects(userUid);
    const lists = await Promise.all(projects.map((p) => getFirestoreProjectExpenses(p.id)));
    return lists.flat();
  } catch {
    return [];
  }
}

export async function getAllFirestoreRecentActivities(
  userUid: string,
  maxItems = 20
): Promise<ActivityLog[]> {
  if (!userUid) return [];
  try {
    const projects = await getFirestoreProjects(userUid);
    const lists = await Promise.all(
      projects.map((p) => getFirestoreProjectActivities(p.id, 5))
    );
    const combined = lists.flat();
    combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return combined.slice(0, maxItems);
  } catch {
    return [];
  }
}
