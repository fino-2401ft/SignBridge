import { create } from "zustand";
import {
  countByCategory,
  fetchDictionaryGestures,
  filterByCategory,
  searchGestures,
} from "../services/dictionaryService";
import type { GestureCategory, GestureDTO } from "../types/gesture";

type DictionaryLoadState = "idle" | "loading" | "ready" | "empty" | "error";

interface DictionaryState {
  gestures: GestureDTO[];
  loadState: DictionaryLoadState;
  errorMessage: string | null;
  query: string;
  selectedCategory: GestureCategory | null;
  loadGestures: () => Promise<void>;
  setQuery: (query: string) => void;
  setSelectedCategory: (category: GestureCategory | null) => void;
  getVisibleGestures: () => GestureDTO[];
  getCategoryCounts: () => Record<string, number>;
  getGestureById: (gestureId: string) => GestureDTO | undefined;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
  gestures: [],
  loadState: "idle",
  errorMessage: null,
  query: "",
  selectedCategory: null,

  loadGestures: async () => {
    set({ loadState: "loading", errorMessage: null });
    try {
      const { gestures } = await fetchDictionaryGestures();
      if (gestures.length === 0) {
        set({ gestures: [], loadState: "empty", errorMessage: null });
        return;
      }
      set({ gestures, loadState: "ready", errorMessage: null });
    } catch (err) {
      set({
        loadState: "error",
        errorMessage:
          err instanceof Error ? err.message : "Search failed. Please try again.",
      });
    }
  },

  setQuery: (query) => set({ query }),

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  getVisibleGestures: () => {
    const { gestures, query, selectedCategory } = get();
    let list = gestures;
    if (selectedCategory) {
      list = filterByCategory(list, selectedCategory);
    }
    const trimmed = query.trim();
    if (trimmed.length >= 1) {
      list = searchGestures(list, trimmed);
    }
    return list;
  },

  getCategoryCounts: () => countByCategory(get().gestures),

  getGestureById: (gestureId) =>
    get().gestures.find((gesture) => gesture.gestureId === gestureId),
}));
