import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { isFirebaseConfigured } from "./firebase-config";
import type { UserProfile } from "@/src/types";

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/invalid-email":
      return "The email address is not formatted correctly.";
    case "auth/user-disabled":
      return "This account has been disabled by an administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please log in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing.";
    default:
      return "Authentication error: " + (errorCode || "An unexpected error occurred.");
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase credentials are not configured in .env.local. Please populate NEXT_PUBLIC_FIREBASE_* variables."
    );
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<User> {
  if (!isFirebaseConfigured() || !auth || !db) {
    throw new Error(
      "Firebase credentials are not configured in .env.local. Please populate NEXT_PUBLIC_FIREBASE_* variables."
    );
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  await updateProfile(user, { displayName });

  // Create user profile in Firestore: users/{uid}
  const userRef = doc(db, "users", user.uid);
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || user.email?.split("@")[0] || "Team Member",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userRef, {
    ...userProfile,
    serverTimestamp: serverTimestamp(),
  });

  return user;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase credentials are not configured in .env.local. Please populate NEXT_PUBLIC_FIREBASE_* variables."
    );
  }
  await sendPasswordResetEmail(auth, email);
}

export async function loginWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured() || !auth || !db) {
    throw new Error(
      "Firebase credentials are not configured in .env.local. Please populate NEXT_PUBLIC_FIREBASE_* variables."
    );
  }
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Check or upsert user profile
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      photoURL: user.photoURL || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, { ...userProfile, serverTimestamp: serverTimestamp() });
  }

  return user;
}

export function subscribeToFirebaseAuthState(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
