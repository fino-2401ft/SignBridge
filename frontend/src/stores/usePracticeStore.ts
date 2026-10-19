import { create } from "zustand";

interface PracticeState {
  targetGestureLabel: string | null;
  accuracyScore: number;
  isSessionActive: boolean;
  handDetected: boolean;
  setTargetGesture: (label: string | null) => void;
  setAccuracyScore: (score: number) => void;
  setHandDetected: (detected: boolean) => void;
  startSession: (label: string) => void;
  endSession: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  targetGestureLabel: null,
  accuracyScore: 0,
  isSessionActive: false,
  handDetected: false,
  setTargetGesture: (targetGestureLabel) => set({ targetGestureLabel }),
  setAccuracyScore: (accuracyScore) =>
    set({ accuracyScore: Math.max(0, Math.min(100, accuracyScore)) }),
  setHandDetected: (handDetected) => set({ handDetected }),
  startSession: (label) =>
    set({
      targetGestureLabel: label,
      isSessionActive: true,
      accuracyScore: 0,
      handDetected: false,
    }),
  endSession: () =>
    set({
      isSessionActive: false,
      accuracyScore: 0,
      handDetected: false,
    }),
}));
