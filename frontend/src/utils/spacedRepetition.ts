import type { FlashCardItem } from "../types/gamification";

export type QualityGrade = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm.
 * Computes repetition schedule and next review date based on grade (0-5):
 * 5: Perfect recall
 * 4: Correct after hesitation
 * 3: Correct with difficulty
 * 2: Incorrect; where the correct answer was easy to recall
 * 1: Incorrect; remembered upon seeing the answer
 * 0: Complete blackout
 */
export function calculateSM2(
  card: FlashCardItem,
  grade: QualityGrade,
): {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string;
  mastered: boolean;
} {
  let { repetitions, easeFactor, intervalDays } = card;

  if (grade >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  return {
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    nextReviewDate: nextDate.toISOString(),
    mastered: repetitions >= 4 && grade >= 4,
  };
}
