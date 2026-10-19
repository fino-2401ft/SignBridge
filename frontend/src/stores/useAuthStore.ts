import { create } from "zustand";
import {
  registerWithEmail,
  signInWithEmail,
  signOutUser,
  subscribeToAuthState,
} from "../services/authService";
import type { LoginFormValues, RegisterFormValues, UserProfile } from "../types";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  authReady: boolean;
  pendingLoginEmail: string | null;
  lockoutUntil: number | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setPendingLoginEmail: (email: string | null) => void;
  initAuthListener: () => () => void;
  login: (values: LoginFormValues) => Promise<void>;
  register: (values: RegisterFormValues) => Promise<void>;
  logout: () => Promise<void>;
  isLockedOut: () => boolean;
  remainingLockoutSeconds: () => number;
  reset: () => void;
}

const initialState = {
  user: null as UserProfile | null,
  isLoading: true,
  isAuthenticated: false,
  isSubmitting: false,
  authReady: false,
  pendingLoginEmail: null as string | null,
  lockoutUntil: null as number | null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
      authReady: true,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setPendingLoginEmail: (pendingLoginEmail) => set({ pendingLoginEmail }),

  initAuthListener: () => {
    set({ isLoading: true, authReady: false });
    return subscribeToAuthState((user) => {
      set({
        user,
        isAuthenticated: user !== null,
        isLoading: false,
        authReady: true,
      });
    });
  },

  login: async (values) => {
    if (get().isLockedOut()) {
      throw new Error(`Too many attempts. Wait ${get().remainingLockoutSeconds()}s.`);
    }

    set({ isSubmitting: true });
    try {
      const profile = await signInWithEmail(values);
      set({
        user: profile,
        isAuthenticated: true,
        isSubmitting: false,
        pendingLoginEmail: null,
        lockoutUntil: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("too many")) {
        set({ lockoutUntil: Date.now() + 30_000, isSubmitting: false });
      } else {
        set({ isSubmitting: false });
      }
      throw error;
    }
  },

  register: async (values) => {
    set({ isSubmitting: true });
    try {
      const { email } = await registerWithEmail(values);
      set({
        isSubmitting: false,
        user: null,
        isAuthenticated: false,
        pendingLoginEmail: email,
      });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isSubmitting: true });
    try {
      await signOutUser();
      set({
        user: null,
        isAuthenticated: false,
        isSubmitting: false,
        pendingLoginEmail: null,
      });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },

  isLockedOut: () => {
    const until = get().lockoutUntil;
    return until !== null && Date.now() < until;
  },

  remainingLockoutSeconds: () => {
    const until = get().lockoutUntil;
    if (until === null) {
      return 0;
    }
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  },

  reset: () => set({ ...initialState, isLoading: false, authReady: true }),
}));
