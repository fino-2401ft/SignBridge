import { create } from "zustand";

export interface LearningPathSummary {
  id: string;
  title: string;
  progress: number;
  locked: boolean;
}

interface LearningState {
  paths: LearningPathSummary[];
  isLoading: boolean;
  setPaths: (paths: LearningPathSummary[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  paths: [],
  isLoading: false,
  setPaths: (paths) => set({ paths, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
