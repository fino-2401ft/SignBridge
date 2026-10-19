import { z } from "zod";

export const GestureCategorySchema = z.enum([
  "alphabet",
  "number",
  "greeting",
  "emergency",
  "daily",
  "family",
  "emotion",
  "verb",
  "basics",
]);

export const GestureSchema = z.object({
  gestureId: z.string().min(1),
  label: z.string().min(1),
  category: GestureCategorySchema,
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  description: z.string().default(""),
  isDynamic: z.boolean().default(false),
});

export type GestureCategory = z.infer<typeof GestureCategorySchema>;
export type GestureDTO = z.infer<typeof GestureSchema>;

export function parseGesture(payload: unknown): GestureDTO {
  return GestureSchema.parse(payload);
}
