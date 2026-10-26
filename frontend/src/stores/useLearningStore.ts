import { create } from "zustand";
import { fetchLearningCatalog } from "../services/learningService";
import type {
  LearningLoadState,
  LearningPath,
  LearningPathViewModel,
  PathProgress,
  UnlockCondition,
} from "../types/learning";
import { useAuthStore } from "./useAuthStore";

interface LearningState {
  paths: LearningPath[];
  progressByPathId: Record<string, PathProgress>;
  loadState: LearningLoadState;
  errorMessage: string | null;
  loadCatalog: () => Promise<void>;
  getPathViewModels: (totalXp: number) => LearningPathViewModel[];
  getAggregateStats: () => {
    completedLessons: number;
    totalLessons: number;
    completedPaths: number;
    totalPaths: number;
    overallPercent: number;
  };
}

function progressFor(
  progressByPathId: Record<string, PathProgress>,
  pathId: string,
): number {
  return progressByPathId[pathId]?.progressPercent ?? 0;
}

function isPathUnlocked(
  condition: UnlockCondition,
  paths: LearningPath[],
  progressByPathId: Record<string, PathProgress>,
  totalXp: number,
): { unlocked: boolean; hint: string } {
  switch (condition.type) {
    case "none":
      return { unlocked: true, hint: "" };
    case "path_complete": {
      const required = paths.find((p) => p.id === condition.requiredPathId);
      const pct = progressFor(progressByPathId, condition.requiredPathId);
      if (pct >= 100) {
        return { unlocked: true, hint: "" };
      }
      const title = required?.title ?? "previous path";
      return {
        unlocked: false,
        hint: `Complete ${title} to unlock`,
      };
    }
    case "xp_threshold":
      if (totalXp >= condition.requiredXp) {
        return { unlocked: true, hint: "" };
      }
      return {
        unlocked: false,
        hint: `Requires ${condition.requiredXp.toLocaleString("en-US")} XP to unlock`,
      };
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

function ctaFor(locked: boolean, progressPercent: number, hint: string): string {
  if (locked) {
    return hint;
  }
  if (progressPercent <= 0) {
    return "Start";
  }
  if (progressPercent >= 100) {
    return "Review";
  }
  return "Continue Learning";
}

export const useLearningStore = create<LearningState>((set, get) => ({
  paths: [],
  progressByPathId: {},
  loadState: "idle",
  errorMessage: null,

  loadCatalog: async () => {
    set({ loadState: "loading", errorMessage: null });
    try {
      const userId = useAuthStore.getState().user?.uid ?? null;
      const { paths, progress } = await fetchLearningCatalog(userId);
      const progressByPathId: Record<string, PathProgress> = {};
      for (const item of progress) {
        progressByPathId[item.pathId] = item;
      }

      if (paths.length === 0) {
        set({
          paths: [],
          progressByPathId: {},
          loadState: "empty",
          errorMessage: null,
        });
        return;
      }

      set({
        paths,
        progressByPathId,
        loadState: "ready",
        errorMessage: null,
      });
    } catch (err) {
      set({
        loadState: "error",
        errorMessage:
          err instanceof Error ? err.message : "Unable to load learning paths",
      });
    }
  },

  getPathViewModels: (totalXp) => {
    const { paths, progressByPathId } = get();
    return paths.map((path) => {
      const { unlocked, hint } = isPathUnlocked(
        path.unlockCondition,
        paths,
        progressByPathId,
        totalXp,
      );
      const progressPercent = progressFor(progressByPathId, path.id);
      const locked = !unlocked;
      return {
        path,
        progressPercent: locked ? 0 : progressPercent,
        locked,
        unlockHint: hint,
        ctaLabel: ctaFor(locked, progressPercent, hint),
      };
    });
  },

  getAggregateStats: () => {
    const { paths, progressByPathId } = get();
    const totalLessons = paths.reduce((sum, p) => sum + p.lessonCount, 0);
    const completedLessons = paths.reduce((sum, p) => {
      const pct = progressFor(progressByPathId, p.id);
      return sum + Math.round((pct / 100) * p.lessonCount);
    }, 0);
    const completedPaths = paths.filter(
      (p) => progressFor(progressByPathId, p.id) >= 100,
    ).length;
    const overallPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      completedLessons,
      totalLessons,
      completedPaths,
      totalPaths: paths.length,
      overallPercent,
    };
  },
}));
