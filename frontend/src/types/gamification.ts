import { z } from "zod";

export const BadgeTierSchema = z.enum(["bronze", "silver", "gold", "diamond"]);
export type BadgeTier = z.infer<typeof BadgeTierSchema>;

export const UserBadgeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  tier: BadgeTierSchema,
  unlockedAt: z.string().optional(),
  progress: z.number().min(0).max(100),
});
export type UserBadge = z.infer<typeof UserBadgeSchema>;

export const LeaderboardEntrySchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(1),
  avatarLetter: z.string(),
  xp: z.number().nonnegative(),
  rank: z.number().positive(),
  streakDays: z.number().nonnegative(),
  isCurrentUser: z.boolean().default(false),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const FlashCardItemSchema = z.object({
  signId: z.string().min(1),
  title: z.string().min(1),
  category: z.string(),
  emoji: z.string().default("👋"),
  videoUrl: z.string().default(""),
  description: z.string().default(""),
  // SM-2 Spaced Repetition fields
  repetitions: z.number().nonnegative().default(0),
  easeFactor: z.number().min(1.3).default(2.5),
  intervalDays: z.number().nonnegative().default(1),
  nextReviewDate: z.string(),
  mastered: z.boolean().default(false),
});
export type FlashCardItem = z.infer<typeof FlashCardItemSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  signId: z.string().min(1),
  signTitle: z.string().min(1),
  prompt: z.string().min(1),
  videoUrl: z.string().default(""),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string().default(""),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizResultSchema = z.object({
  totalQuestions: z.number().positive(),
  correctCount: z.number().nonnegative(),
  scorePercent: z.number().min(0).max(100),
  earnedXp: z.number().nonnegative(),
  completedAt: z.string(),
});
export type QuizResult = z.infer<typeof QuizResultSchema>;

export const GamificationStatsSchema = z.object({
  totalXp: z.number().nonnegative().default(0),
  level: z.number().positive().default(1),
  levelProgressPercent: z.number().min(0).max(100).default(0),
  streakDays: z.number().nonnegative().default(0),
  lastPracticeDate: z.string().optional(),
  signsMasteredCount: z.number().nonnegative().default(0),
  quizzesCompletedCount: z.number().nonnegative().default(0),
});
export type GamificationStats = z.infer<typeof GamificationStatsSchema>;
