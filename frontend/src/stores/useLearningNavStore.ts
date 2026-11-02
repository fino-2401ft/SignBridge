import { create } from "zustand";

export type LearningRoute =
  | { name: "home" }
  | { name: "dictionary" }
  | { name: "path"; pathId: string }
  | { name: "lesson"; pathId: string; lessonId: string };

interface LearningNavState {
  route: LearningRoute;
  openHome: () => void;
  openDictionary: () => void;
  openPath: (pathId: string) => void;
  openLesson: (pathId: string, lessonId: string) => void;
  goBack: () => void;
}

export const useLearningNavStore = create<LearningNavState>((set, get) => ({
  route: { name: "home" },

  openHome: () => set({ route: { name: "home" } }),

  openDictionary: () => set({ route: { name: "dictionary" } }),

  openPath: (pathId) => set({ route: { name: "path", pathId } }),

  openLesson: (pathId, lessonId) =>
    set({ route: { name: "lesson", pathId, lessonId } }),

  goBack: () => {
    const { route } = get();
    if (route.name === "lesson") {
      set({ route: { name: "path", pathId: route.pathId } });
      return;
    }
    if (route.name === "path" || route.name === "dictionary") {
      set({ route: { name: "home" } });
    }
  },
}));
