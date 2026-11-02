import { z } from "zod";

/** Categories aligned with PRD FR-010 (+ legacy seed aliases). */
export const GestureCategorySchema = z.enum([
  "greetings",
  "alphabet",
  "numbers",
  "family",
  "emotions",
  "verbs",
  "nouns",
  "time",
  "food",
  "colors",
  "questions",
  "emergency",
  "daily",
  // Legacy aliases from earlier seed / ARCHITECTURE drafts
  "greeting",
  "number",
  "emotion",
  "verb",
  "basics",
]);

export const GestureDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const GestureSchema = z.object({
  gestureId: z.string().min(1),
  label: z.string().min(1),
  alternatives: z.array(z.string()).default([]),
  category: GestureCategorySchema,
  videoUrl: z.string().url().or(z.literal("")),
  thumbnailUrl: z.string().url().or(z.literal("")).optional(),
  description: z.string().default(""),
  difficulty: GestureDifficultySchema.default("beginner"),
  tags: z.array(z.string()).default([]),
  isDynamic: z.boolean().default(false),
  pronunciation: z.string().optional(),
});

export type GestureCategory = z.infer<typeof GestureCategorySchema>;
export type GestureDifficulty = z.infer<typeof GestureDifficultySchema>;
export type GestureDTO = z.infer<typeof GestureSchema>;

export function parseGesture(payload: unknown): GestureDTO {
  return GestureSchema.parse(payload);
}

export interface DictionaryCategoryMeta {
  id: GestureCategory;
  name: string;
  icon: string;
  description: string;
}

/** Display order for category browse grid (FR-010). */
export const DICTIONARY_CATEGORIES: DictionaryCategoryMeta[] = [
  { id: "greetings", name: "Greetings", icon: "👋", description: "Hello, Thank you, Sorry" },
  { id: "alphabet", name: "Alphabet", icon: "🔤", description: "A–Z letters" },
  { id: "numbers", name: "Numbers", icon: "🔢", description: "0–10 and counting" },
  { id: "family", name: "Family", icon: "👨‍👩‍👧", description: "Family members" },
  { id: "emotions", name: "Emotions", icon: "😊", description: "Happy, Sad, Angry" },
  { id: "verbs", name: "Verbs", icon: "🏃", description: "Action words" },
  { id: "food", name: "Food", icon: "🍕", description: "Food and drinks" },
  { id: "questions", name: "Questions", icon: "❓", description: "Who, What, Where" },
  { id: "time", name: "Time", icon: "⏰", description: "Days and time" },
  { id: "colors", name: "Colors", icon: "🎨", description: "Color words" },
  { id: "emergency", name: "Emergency", icon: "🆘", description: "Help and safety" },
  { id: "daily", name: "Daily", icon: "🏠", description: "Everyday signs" },
];

export function normalizeCategory(category: GestureCategory): GestureCategory {
  switch (category) {
    case "greeting":
      return "greetings";
    case "number":
      return "numbers";
    case "emotion":
      return "emotions";
    case "verb":
      return "verbs";
    case "basics":
      return "daily";
    default:
      return category;
  }
}

export function categoryDisplayName(category: GestureCategory): string {
  const normalized = normalizeCategory(category);
  return (
    DICTIONARY_CATEGORIES.find((item) => item.id === normalized)?.name ??
    normalized
  );
}
