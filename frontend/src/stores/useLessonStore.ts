import { create } from "zustand";
import { completeLesson, fetchLessonsForPath } from "../services/lessonService";
import type { Lesson, LessonLoadState, LessonViewModel } from "../types/lesson";
import { getLevelInfo } from "../utils/level";
import { useAuthStore } from "./useAuthStore";
import { useLearningStore } from "./useLearningStore";

interface LessonState {
  pathId: string | null;
  lessons: Lesson[];
  loadState: LessonLoadState;
  errorMessage: string | null;
  isCompleting: boolean;
  loadLessons: (pathId: string) => Promise<void>;
  getLessonViewModels: () => LessonViewModel[];
  markLessonComplete: (lessonId: string) => Promise<{
    awardedXp: number;
    xpPendingSync: boolean;
    nextLessonId: string | null;
  }>;
  clear: () => void;
}

function completedIdsForPath(pathId: string): string[] {
  return useLearningStore.getState().progressByPathId[pathId]?.completedLessonIds ?? [];
}

export const useLessonStore = create<LessonState>((set, get) => ({
  pathId: null,
  lessons: [],
  loadState: "idle",
  errorMessage: null,
  isCompleting: false,

  loadLessons: async (pathId) => {
    set({
      pathId,
      loadState: "loading",
      errorMessage: null,
      lessons: [],
    });
    try {
      const { lessons } = await fetchLessonsForPath(pathId);
      if (lessons.length === 0) {
        set({ lessons: [], loadState: "empty", errorMessage: null });
        return;
      }
      set({ lessons, loadState: "ready", errorMessage: null });
    } catch (err) {
      set({
        loadState: "error",
        errorMessage:
          err instanceof Error ? err.message : "Unable to load lessons",
      });
    }
  },

  getLessonViewModels: () => {
    const { pathId, lessons } = get();
    if (!pathId) {
      return [];
    }
    const completed = new Set(completedIdsForPath(pathId));
    const sorted = [...lessons].sort((a, b) => a.order - b.order);

    return sorted.map((lesson, index) => {
      if (completed.has(lesson.id)) {
        return { lesson, status: "completed" as const };
      }
      const previous = sorted[index - 1];
      const unlocked =
        index === 0 || (previous !== undefined && completed.has(previous.id));
      return {
        lesson,
        status: unlocked ? ("available" as const) : ("locked" as const),
      };
    });
  },

  markLessonComplete: async (lessonId) => {
    const { pathId, lessons } = get();
    const user = useAuthStore.getState().user;
    if (!pathId || !user) {
      throw new Error("Missing user or path.");
    }

    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    const path = useLearningStore.getState().paths.find((p) => p.id === pathId);
    const lessonCount = path?.lessonCount ?? lessons.length;
    const alreadyCompleted = completedIdsForPath(pathId);
    if (alreadyCompleted.includes(lessonId)) {
      const views = get().getLessonViewModels();
      const currentIndex = views.findIndex((v) => v.lesson.id === lessonId);
      const next = views[currentIndex + 1];
      return {
        awardedXp: 0,
        xpPendingSync: false,
        nextLessonId: next && next.status !== "locked" ? next.lesson.id : null,
      };
    }

    set({ isCompleting: true });
    try {
      const result = await completeLesson({
        userId: user.uid,
        pathId,
        lessonId,
        lessonCount,
        completedLessonIds: alreadyCompleted,
        xpReward: lesson.xpReward,
      });

      const progressByPathId = {
        ...useLearningStore.getState().progressByPathId,
        [pathId]: {
          pathId,
          completedLessonIds: result.completedLessonIds,
          progressPercent: result.progressPercent,
        },
      };
      useLearningStore.setState({ progressByPathId });

      const bonus = result.pathBonusXp ?? 0;
      const nextXp = result.totalXp ?? user.totalXp + result.awardedXp + bonus;
      const level =
        result.currentLevel !== undefined
          ? { level: result.currentLevel }
          : getLevelInfo(nextXp);
      useAuthStore.getState().setUser({
        ...user,
        totalXp: nextXp,
        currentLevel: level.level,
      });

      const views = get().getLessonViewModels();
      const currentIndex = views.findIndex((v) => v.lesson.id === lessonId);
      const next = views[currentIndex + 1];

      set({ isCompleting: false });
      return {
        awardedXp: result.awardedXp,
        xpPendingSync: result.xpPendingSync,
        nextLessonId: next ? next.lesson.id : null,
      };
    } catch (err) {
      set({ isCompleting: false });
      throw err;
    }
  },

  clear: () =>
    set({
      pathId: null,
      lessons: [],
      loadState: "idle",
      errorMessage: null,
      isCompleting: false,
    }),
}));
