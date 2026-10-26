import { z } from "zod";

export const UnlockConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({
    type: z.literal("path_complete"),
    requiredPathId: z.string().min(1),
  }),
  z.object({
    type: z.literal("xp_threshold"),
    requiredXp: z.number().int().nonnegative(),
  }),
]);

export const LearningPathSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  lessonCount: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  icon: z.string().min(1),
  unlockCondition: UnlockConditionSchema,
});

export const PathProgressSchema = z.object({
  pathId: z.string().min(1),
  completedLessonIds: z.array(z.string()),
  progressPercent: z.number().min(0).max(100),
});

export type UnlockCondition = z.infer<typeof UnlockConditionSchema>;
export type LearningPath = z.infer<typeof LearningPathSchema>;
export type PathProgress = z.infer<typeof PathProgressSchema>;

export interface LearningPathViewModel {
  path: LearningPath;
  progressPercent: number;
  locked: boolean;
  unlockHint: string;
  ctaLabel: string;
}

export type LearningLoadState = "idle" | "loading" | "ready" | "empty" | "error";

export function parseLearningPath(payload: unknown): LearningPath {
  return LearningPathSchema.parse(payload);
}
