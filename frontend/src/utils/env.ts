import { z } from "zod";

const EnvSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readRawEnv(): unknown {
  return {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export const env: AppEnv = EnvSchema.parse(readRawEnv());

export function getFirebaseConfig(): FirebasePublicConfig | null {
  const {
    EXPO_PUBLIC_FIREBASE_API_KEY: apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    EXPO_PUBLIC_FIREBASE_APP_ID: appId,
  } = env;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}
