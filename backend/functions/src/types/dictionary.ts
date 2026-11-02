/** Firestore dictionary gesture document (FR-009 / FR-010 / FR-011). */

export type DictionaryCategory =
  | "greetings"
  | "alphabet"
  | "numbers"
  | "family"
  | "emotions"
  | "verbs"
  | "nouns"
  | "time"
  | "food"
  | "colors"
  | "questions"
  | "emergency"
  | "daily";

export type DictionaryDifficulty = "beginner" | "intermediate" | "advanced";

export interface DictionaryGestureDocument {
  gestureId: string;
  label: string;
  alternatives: string[];
  category: DictionaryCategory;
  videoUrl: string;
  thumbnailUrl?: string;
  description: string;
  difficulty: DictionaryDifficulty;
  tags: string[];
  isDynamic: boolean;
  pronunciation?: string;
  isPublished: boolean;
}

export interface PracticeQueueItem {
  gestureId: string;
  userId: string;
  label: string;
  category: string;
}
