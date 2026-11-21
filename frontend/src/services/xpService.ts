import type { GamificationStats } from "../types/gamification";

const XP_PER_LEVEL_BASE = 250;
const LEVEL_SCALING_FACTOR = 1.25;

/**
 * Calculates user level from accumulated XP.
 * Level 1: 0 - 250 XP
 * Level 2: 251 - 562 XP, etc.
 */
export function calculateLevelFromXp(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, totalXp);
  let level = 1;
  let accumulatedXp = 0;
  let requiredForCurrent = XP_PER_LEVEL_BASE;

  while (safeXp >= accumulatedXp + requiredForCurrent) {
    accumulatedXp += requiredForCurrent;
    level += 1;
    requiredForCurrent = Math.round(XP_PER_LEVEL_BASE * Math.pow(LEVEL_SCALING_FACTOR, level - 1));
  }

  const currentLevelXp = safeXp - accumulatedXp;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / requiredForCurrent) * 100));

  return {
    level,
    currentLevelXp,
    xpToNextLevel: requiredForCurrent - currentLevelXp,
    progressPercent,
  };
}

/**
 * Updates streak based on last practice date string (YYYY-MM-DD or ISO).
 */
export function computeStreak(
  currentStreak: number,
  lastPracticeDateStr?: string,
): { newStreak: number; streakMaintained: boolean } {
  if (!lastPracticeDateStr) {
    return { newStreak: 1, streakMaintained: true };
  }

  const today = new Date();
  const lastDate = new Date(lastPracticeDateStr);

  // Normalize to UTC midnight dates
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

  const diffDays = Math.round((todayDateOnly - lastDateOnly) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already practiced today
    return { newStreak: currentStreak, streakMaintained: true };
  }
  if (diffDays === 1) {
    // Practiced yesterday — streak incremented
    return { newStreak: currentStreak + 1, streakMaintained: true };
  }
  // Missed a day — reset streak to 1
  return { newStreak: 1, streakMaintained: false };
}
