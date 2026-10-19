import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  AuthServiceError,
  type LoginFormValues,
  type RegisterFormValues,
  type UserProfile,
  parseUserProfile,
} from "../types";
import { isFirebaseConfigured } from "../utils/env";
import { requireFirebase } from "./firebase";

export interface AuthCredentials {
  email: string;
  password: string;
}

function mapFirebaseAuthError(error: unknown): AuthServiceError {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "unknown";

  switch (code) {
    case "auth/email-already-in-use":
      return new AuthServiceError("email_in_use", "Email already in use", "email");
    case "auth/invalid-email":
      return new AuthServiceError("invalid_email", "Invalid email format", "email");
    case "auth/weak-password":
      return new AuthServiceError(
        "weak_password",
        "Password must be at least 8 characters",
        "password",
      );
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return new AuthServiceError(
        "invalid_credentials",
        "Invalid email or password",
        "form",
      );
    case "auth/too-many-requests":
      return new AuthServiceError(
        "too_many_attempts",
        "Too many attempts. Please wait 30 seconds.",
        "form",
      );
    case "auth/network-request-failed":
      return new AuthServiceError(
        "network",
        "Connection error. Please try again.",
        "form",
      );
    default:
      if (!isFirebaseConfigured()) {
        return new AuthServiceError(
          "not_configured",
          "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to .env.",
          "form",
        );
      }
      return new AuthServiceError(
        "unknown",
        "Something went wrong. Please try again.",
        "form",
      );
  }
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "Learner";
  return local.length > 0 ? local : "Learner";
}

function profileFromAuthUser(user: FirebaseUser, existing?: Partial<UserProfile>): UserProfile {
  return parseUserProfile({
    uid: user.uid,
    email: user.email ?? existing?.email ?? "",
    displayName: user.displayName ?? existing?.displayName ?? displayNameFromEmail(user.email ?? "learner"),
    role: existing?.role ?? "learner",
    totalXp: existing?.totalXp ?? 0,
    currentLevel: existing?.currentLevel ?? 1,
    currentStreak: existing?.currentStreak ?? 0,
  });
}

async function ensureUserDocument(user: FirebaseUser): Promise<UserProfile> {
  const { db } = requireFirebase();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return profileFromAuthUser(user, {
      email: typeof data.email === "string" ? data.email : undefined,
      displayName: typeof data.displayName === "string" ? data.displayName : undefined,
      role: data.role === "admin" ? "admin" : "learner",
      totalXp: typeof data.totalXp === "number" ? data.totalXp : 0,
      currentLevel: typeof data.currentLevel === "number" ? data.currentLevel : 1,
      currentStreak: typeof data.currentStreak === "number" ? data.currentStreak : 0,
    });
  }

  const profile = profileFromAuthUser(user);
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });
  return profile;
}

export async function signInWithEmail(credentials: LoginFormValues): Promise<UserProfile> {
  try {
    const { auth } = requireFirebase();
    const result = await signInWithEmailAndPassword(
      auth,
      credentials.email.trim(),
      credentials.password,
    );
    return await ensureUserDocument(result.user);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    throw mapFirebaseAuthError(error);
  }
}

/**
 * Creates account + Firestore profile, then signs out so the user lands on Login (FR-001).
 */
export async function registerWithEmail(
  values: RegisterFormValues,
): Promise<{ email: string }> {
  try {
    const { auth, db } = requireFirebase();
    const email = values.email.trim();
    const result = await createUserWithEmailAndPassword(auth, email, values.password);
    const displayName = displayNameFromEmail(email);

    await updateProfile(result.user, { displayName });

    const profile = parseUserProfile({
      uid: result.user.uid,
      email,
      displayName,
      role: "learner",
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
    });

    await setDoc(doc(db, "users", result.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });

    await signOut(auth);
    return { email };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    throw mapFirebaseAuthError(error);
  }
}

export async function signOutUser(): Promise<void> {
  try {
    const { auth } = requireFirebase();
    await signOut(auth);
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

export function subscribeToAuthState(
  onChange: (profile: UserProfile | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    onChange(null);
    return () => undefined;
  }

  const { auth } = requireFirebase();
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null);
      return;
    }
    try {
      const profile = await ensureUserDocument(user);
      onChange(profile);
    } catch {
      onChange(profileFromAuthUser(user));
    }
  });
}
