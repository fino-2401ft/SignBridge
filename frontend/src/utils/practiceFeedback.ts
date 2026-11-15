import type { PracticeFeedback } from "../types/practice";
import { colors } from "./theme";

/** FR-013 / FR-006 feedback thresholds for live accuracy HUD. */
export function getPracticeFeedback(score: number): PracticeFeedback {
  if (score >= 90) {
    return { message: "Perfect!", color: colors.success, icon: "🌟" };
  }
  if (score >= 80) {
    return { message: "Great!", color: colors.success, icon: "✅" };
  }
  if (score >= 70) {
    return { message: "Good!", color: colors.success, icon: "👍" };
  }
  if (score >= 50) {
    return { message: "Keep trying", color: colors.warning, icon: "💪" };
  }
  if (score >= 30) {
    return { message: "Try again", color: colors.error, icon: "🔄" };
  }
  return { message: "Not quite", color: colors.error, icon: "❌" };
}

export function formatSessionDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
