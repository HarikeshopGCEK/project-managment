import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { firebaseEnvConfig, isFirebaseConfigured } from "./firebase-config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (typeof window !== "undefined" || process.env.NODE_ENV !== "test") {
  if (isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseEnvConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      if (typeof window !== "undefined") {
        isSupported().then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
          }
        }).catch(() => {
          // Analytics not supported in this environment
        });
      }
    } catch (error) {
      console.warn("Failed to initialize Firebase client:", error);
    }
  }
}

export { app, auth, db, analytics };
export default app;
