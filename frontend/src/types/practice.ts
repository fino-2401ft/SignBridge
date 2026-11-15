import { z } from "zod";

export const HandDetectionStateSchema = z.enum([
  "detected",
  "partial",
  "not_detected",
  "multiple",
]);

export const PracticeGestureStatSchema = z.object({
  gestureId: z.string().min(1),
  label: z.string().min(1),
  attempts: z.number().int().nonnegative(),
  avgScore: z.number().min(0).max(100),
  bestScore: z.number().min(0).max(100),
});

export const PracticeSessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  gestures: z.array(PracticeGestureStatSchema),
  totalAttempts: z.number().int().nonnegative(),
  avgScore: z.number().min(0).max(100),
  bestScore: z.number().min(0).max(100),
  xpEarned: z.number().int().nonnegative(),
});

export type HandDetectionState = z.infer<typeof HandDetectionStateSchema>;
export type PracticeGestureStat = z.infer<typeof PracticeGestureStatSchema>;
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

export interface PracticeFeedback {
  message: string;
  color: string;
  icon: string;
}

export type PracticeRoute =
  | { name: "list" }
  | { name: "room"; gestureId: string }
  | { name: "summary"; sessionId: string };

export function parsePracticeSession(payload: unknown): PracticeSession {
  return PracticeSessionSchema.parse(payload);
}
