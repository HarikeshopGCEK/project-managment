export interface FirebaseConfigStatus {
  isConfigured: boolean;
  isDemoMode: boolean;
  isProduction: boolean;
  missingKeys: string[];
  presentKeys: string[];
  projectId: string;
}

export const firebaseEnvConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredKeys: (keyof typeof firebaseEnvConfig)[] = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingKeys: string[] = [];
  const presentKeys: string[] = [];

  for (const key of requiredKeys) {
    const val = firebaseEnvConfig[key];
    if (!val || val.length === 0 || val.startsWith("YOUR_") || val === "undefined") {
      missingKeys.push(`NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (l) => `_${l}`).toUpperCase()}`);
    } else {
      presentKeys.push(key);
    }
  }

  const isConfigured = missingKeys.length === 0;
  // Demo mode is ONLY permitted in development when configuration is missing.
  // In a production build, demo mode is strictly disabled and never silent.
  const isDemoMode = !isConfigured && !isProduction;

  return {
    isConfigured,
    isDemoMode,
    isProduction,
    missingKeys,
    presentKeys,
    projectId: firebaseEnvConfig.projectId || "not-configured",
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigStatus().isConfigured;
}

export function isDemoModeActive(): boolean {
  return getFirebaseConfigStatus().isDemoMode;
}
