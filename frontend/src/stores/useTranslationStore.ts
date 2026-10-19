import { create } from "zustand";

interface TranslationState {
  tokens: string[];
  confidence: number;
  isListening: boolean;
  appendToken: (token: string) => void;
  clearTokens: () => void;
  setConfidence: (confidence: number) => void;
  setListening: (isListening: boolean) => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  tokens: [],
  confidence: 0,
  isListening: false,
  appendToken: (token) =>
    set((state) => ({
      tokens: [...state.tokens, token],
    })),
  clearTokens: () => set({ tokens: [], confidence: 0 }),
  setConfidence: (confidence) =>
    set({ confidence: Math.max(0, Math.min(1, confidence)) }),
  setListening: (isListening) => set({ isListening }),
}));
