import { create } from "zustand";
import type { PracticeRoute } from "../types/practice";
import type { MainTab } from "../utils/constants";

export type DictionaryRoute =
  | { name: "list" }
  | { name: "detail"; gestureId: string };

interface AppNavState {
  activeTab: MainTab;
  dictionaryRoute: DictionaryRoute;
  practiceRoute: PracticeRoute;
  setTab: (tab: MainTab) => void;
  openDictionaryList: () => void;
  openGestureDetail: (gestureId: string) => void;
  goBackDictionary: () => void;
  openPracticeList: () => void;
  openPracticeRoom: (gestureId: string) => void;
  openPracticeSummary: (sessionId: string) => void;
  goBackPractice: () => void;
  reset: () => void;
}

export const useAppNavStore = create<AppNavState>((set) => ({
  activeTab: "Learn",
  dictionaryRoute: { name: "list" },
  practiceRoute: { name: "list" },

  setTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      dictionaryRoute:
        tab === "Dictionary" && state.activeTab !== "Dictionary"
          ? { name: "list" }
          : state.dictionaryRoute,
      practiceRoute:
        tab === "Practice" && state.activeTab !== "Practice"
          ? { name: "list" }
          : state.practiceRoute,
    })),

  openDictionaryList: () =>
    set({ activeTab: "Dictionary", dictionaryRoute: { name: "list" } }),

  openGestureDetail: (gestureId) =>
    set({
      activeTab: "Dictionary",
      dictionaryRoute: { name: "detail", gestureId },
    }),

  goBackDictionary: () => set({ dictionaryRoute: { name: "list" } }),

  openPracticeList: () =>
    set({ activeTab: "Practice", practiceRoute: { name: "list" } }),

  openPracticeRoom: (gestureId) =>
    set({
      activeTab: "Practice",
      practiceRoute: { name: "room", gestureId },
    }),

  openPracticeSummary: (sessionId) =>
    set({
      activeTab: "Practice",
      practiceRoute: { name: "summary", sessionId },
    }),

  goBackPractice: () => set({ practiceRoute: { name: "list" } }),

  reset: () =>
    set({
      activeTab: "Learn",
      dictionaryRoute: { name: "list" },
      practiceRoute: { name: "list" },
    }),
}));
