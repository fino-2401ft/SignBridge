import { create } from "zustand";
import { createMockPracticeScorer } from "../ml/practiceScorer";
import {
  buildPracticeSession,
  savePracticeSession,
} from "../services/practiceService";
import type {
  HandDetectionState,
  PracticeGestureStat,
  PracticeSession,
} from "../types/practice";
import { useAuthStore } from "./useAuthStore";

interface ActiveGestureTracker {
  gestureId: string;
  label: string;
  scores: number[];
}

interface PracticeState {
  targetGestureId: string | null;
  targetGestureLabel: string | null;
  accuracyScore: number;
  handState: HandDetectionState;
  isSessionActive: boolean;
  lightingWarning: boolean;
  sessionStartedAt: string | null;
  lastSession: PracticeSession | null;
  isSaving: boolean;
  startSession: (gestureId: string, label: string) => void;
  setTargetGesture: (gestureId: string, label: string) => void;
  tickScore: () => void;
  setLightingWarning: (warning: boolean) => void;
  endSession: () => Promise<PracticeSession | null>;
  clearLastSession: () => void;
}

let scorer: ReturnType<typeof createMockPracticeScorer> | null = null;
let tracker: ActiveGestureTracker | null = null;
const completedTrackers: ActiveGestureTracker[] = [];

function trackerToStat(item: ActiveGestureTracker): PracticeGestureStat {
  const attempts = item.scores.length;
  const bestScore = attempts > 0 ? Math.max(...item.scores) : 0;
  const avgScore =
    attempts > 0
      ? Math.round(item.scores.reduce((sum, score) => sum + score, 0) / attempts)
      : 0;
  return {
    gestureId: item.gestureId,
    label: item.label,
    attempts,
    avgScore,
    bestScore,
  };
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  targetGestureId: null,
  targetGestureLabel: null,
  accuracyScore: 0,
  handState: "not_detected",
  isSessionActive: false,
  lightingWarning: false,
  sessionStartedAt: null,
  lastSession: null,
  isSaving: false,

  startSession: (gestureId, label) => {
    scorer = createMockPracticeScorer(label);
    tracker = { gestureId, label, scores: [] };
    completedTrackers.length = 0;
    set({
      targetGestureId: gestureId,
      targetGestureLabel: label,
      isSessionActive: true,
      accuracyScore: 0,
      handState: "not_detected",
      lightingWarning: false,
      sessionStartedAt: new Date().toISOString(),
      lastSession: null,
    });
  },

  setTargetGesture: (gestureId, label) => {
    if (tracker && tracker.scores.length > 0) {
      completedTrackers.push(tracker);
    }
    tracker = { gestureId, label, scores: [] };
    scorer = createMockPracticeScorer(label);
    set({
      targetGestureId: gestureId,
      targetGestureLabel: label,
      accuracyScore: 0,
      handState: "not_detected",
    });
  },

  tickScore: () => {
    if (!get().isSessionActive || !scorer || !tracker) {
      return;
    }
    const tick = scorer.nextTick();
    if (tick.handState === "detected" || tick.handState === "partial") {
      tracker.scores.push(tick.score);
    }
    set({
      accuracyScore: tick.score,
      handState: tick.handState,
      lightingWarning: tick.score < 40 && tick.handState !== "not_detected",
    });
  },

  setLightingWarning: (lightingWarning) => set({ lightingWarning }),

  endSession: async () => {
    const state = get();
    if (!state.isSessionActive || !state.sessionStartedAt) {
      return null;
    }

    if (tracker && tracker.scores.length > 0) {
      completedTrackers.push(tracker);
    }

    const user = useAuthStore.getState().user;
    const userId = user?.uid ?? "local-user";
    const gestureStats = completedTrackers.map(trackerToStat);
    const session = buildPracticeSession({
      userId,
      startTime: new Date(state.sessionStartedAt),
      endTime: new Date(),
      gestureStats,
    });

    set({ isSaving: true });
    await savePracticeSession(session);

    scorer = null;
    tracker = null;
    completedTrackers.length = 0;

    set({
      isSessionActive: false,
      accuracyScore: 0,
      handState: "not_detected",
      lightingWarning: false,
      sessionStartedAt: null,
      lastSession: session,
      isSaving: false,
    });

    return session;
  },

  clearLastSession: () => set({ lastSession: null }),
}));
