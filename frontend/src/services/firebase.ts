import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getFirebaseConfig, isFirebaseConfigured } from "../utils/env";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;

function createFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } catch {
    return getFirestore(app);
  }
}

/**
 * Initializes Firebase Auth, Firestore (offline persistence), and Storage.
 * Returns null when EXPO_PUBLIC_FIREBASE_* env vars are not configured.
 *
 * Note: Auth AsyncStorage persistence can be added in ROADMAP Prompt 2 via
 * initializeAuth + getReactNativePersistence when wiring the auth session.
 */
export function getFirebase(): FirebaseServices | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (services) {
    return services;
  }

  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = createFirestore(app);
  const storage = getStorage(app);

  services = { app, auth, db, storage };
  return services;
}

export function requireFirebase(): FirebaseServices {
  const instance = getFirebase();
  if (!instance) {
    throw new Error(
      "Firebase is not configured. Copy frontend/.env.example to frontend/.env and fill EXPO_PUBLIC_FIREBASE_* values.",
    );
  }
  return instance;
}
