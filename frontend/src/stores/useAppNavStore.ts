import { create } from "zustand";
import type { MainTab } from "../utils/constants";

export type DictionaryRoute =
  | { name: "list" }
  | { name: "detail"; gestureId: string };

interface AppNavState {
  activeTab: MainTab;
  dictionaryRoute: DictionaryRoute;
  setTab: (tab: MainTab) => void;
  openDictionaryList: () => void;
  openGestureDetail: (gestureId: string) => void;
  goBackDictionary: () => void;
  reset: () => void;
}

export const useAppNavStore = create<AppNavState>((set) => ({
  activeTab: "Learn",
  dictionaryRoute: { name: "list" },

  setTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      dictionaryRoute:
        tab === "Dictionary" && state.activeTab !== "Dictionary"
          ? { name: "list" }
          : state.dictionaryRoute,
    })),

  openDictionaryList: () =>
    set({ activeTab: "Dictionary", dictionaryRoute: { name: "list" } }),

  openGestureDetail: (gestureId) =>
    set({
      activeTab: "Dictionary",
      dictionaryRoute: { name: "detail", gestureId },
    }),

  goBackDictionary: () => set({ dictionaryRoute: { name: "list" } }),

  reset: () => set({ activeTab: "Learn", dictionaryRoute: { name: "list" } }),
}));
