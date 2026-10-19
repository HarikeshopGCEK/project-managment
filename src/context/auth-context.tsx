"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  subscribeToFirebaseAuthState,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  resetPassword,
  loginWithGoogle,
} from "@/src/lib/firebase-auth";
import { getFirebaseConfigStatus } from "@/src/lib/firebase-config";
import { getDemoActiveUser, setDemoActiveUser } from "@/src/lib/data-service";
import { DEMO_USERS } from "@/src/lib/demo-data";
import type { UserProfile } from "@/src/types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  switchDemoUser: (user: UserProfile) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  isConfigured: false,
  isDemoMode: false,
  switchDemoUser: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  sendResetEmail: async () => {},
  googleSignIn: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const status = getFirebaseConfigStatus();
    return status.isDemoMode ? getDemoActiveUser() : null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => {
    const status = getFirebaseConfigStatus();
    return status.isConfigured;
  });
  const [isConfigured] = useState(() => getFirebaseConfigStatus().isConfigured);
  const [isDemoMode] = useState(() => getFirebaseConfigStatus().isDemoMode);

  useEffect(() => {
    const status = getFirebaseConfigStatus();

    if (status.isConfigured) {
      const unsubscribe = subscribeToFirebaseAuthState((fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            photoURL: fbUser.photoURL || undefined,
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const switchDemoUser = (newUser: UserProfile) => {
    if (isDemoMode) {
      setDemoActiveUser(newUser);
      setUser(newUser);
    }
  };

  const login = async (email: string, pass: string) => {
    if (!isConfigured) {
      if (isDemoMode) {
        const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          switchDemoUser(found);
          return;
        }
        throw new Error(
          `Demo account with email "${email}" not found. Try one of: ${DEMO_USERS.map((u) => u.email).join(", ")} or configure Firebase in .env.local`
        );
      }
      throw new Error("Firebase credentials missing. Check .env.local configuration.");
    }
    await loginWithEmail(email, pass);
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!isConfigured) {
      if (isDemoMode) {
        const newDemoUser: UserProfile = {
          uid: `demo-uid-${Date.now()}`,
          email,
          displayName: name,
          department: "Engineering Faculty / Capstone",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        switchDemoUser(newDemoUser);
        return;
      }
      throw new Error("Firebase credentials missing. Check .env.local configuration.");
    }
    await registerWithEmail(email, pass, name);
  };

  const logout = async () => {
    if (isConfigured) {
      await logoutUser();
    } else if (isDemoMode) {
      setUser(null);
    }
  };

  const sendResetEmail = async (email: string) => {
    if (!isConfigured) {
      if (isDemoMode) {
        // Return friendly mock notice
        return;
      }
      throw new Error("Firebase credentials missing. Check .env.local configuration.");
    }
    await resetPassword(email);
  };

  const googleSignIn = async () => {
    if (!isConfigured) {
      throw new Error("Google Sign-In requires active Firebase credentials in .env.local.");
    }
    await loginWithGoogle();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isConfigured,
        isDemoMode,
        switchDemoUser,
        login,
        register,
        logout,
        sendResetEmail,
        googleSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
