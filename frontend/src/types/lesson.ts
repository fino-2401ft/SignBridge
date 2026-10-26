import { z } from "zod";

export const LessonSchema = z.object({
  id: z.string().min(1),
  pathId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  videoUrl: z.string().url().or(z.literal("")),
  thumbnailUrl: z.string().optional(),
  durationSeconds: z.number().int().positive(),
  xpReward: z.number().int().positive(),
  gestures: z.array(z.string().min(1)).min(1),
  order: z.number().int().positive(),
});

export type Lesson = z.infer<typeof LessonSchema>;

export type LessonStatus = "locked" | "available" | "completed";

export interface LessonViewModel {
  lesson: Lesson;
  status: LessonStatus;
}

export type LessonLoadState = "idle" | "loading" | "ready" | "empty" | "error";

export function parseLesson(payload: unknown): Lesson {
  return LessonSchema.parse(payload);
}
