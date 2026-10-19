/**
 * Auth service facade — wrap Firebase Auth here (ROADMAP Prompt 2).
 * UI and stores must not call Firebase Auth APIs directly.
 */

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function signInWithEmail(_credentials: AuthCredentials): Promise<void> {
  throw new Error("signInWithEmail is not implemented yet (ROADMAP Prompt 2).");
}

export async function registerWithEmail(_credentials: AuthCredentials): Promise<void> {
  throw new Error("registerWithEmail is not implemented yet (ROADMAP Prompt 2).");
}

export async function signOutUser(): Promise<void> {
  throw new Error("signOutUser is not implemented yet (ROADMAP Prompt 2).");
}
