import type { HandDetectionState } from "../types/practice";

export interface PracticeScoreTick {
  score: number;
  handState: HandDetectionState;
  confidence: number;
}

/**
 * Simulated on-device scorer for Practice Room UI (FR-013).
 * Replace with MediaPipe + TFLite pipeline in ROADMAP Prompt 3.
 */
export function createMockPracticeScorer(seedLabel: string): {
  nextTick: () => PracticeScoreTick;
  reset: () => void;
} {
  let tick = 0;
  let rolling = 45 + (seedLabel.length % 20);

  return {
    reset: () => {
      tick = 0;
      rolling = 45 + (seedLabel.length % 20);
    },
    nextTick: () => {
      tick += 1;
      const wave = Math.sin(tick / 4) * 12;
      const drift = ((tick % 7) - 3) * 2;
      const noise = ((tick * 17) % 11) - 5;
      rolling = Math.max(18, Math.min(98, rolling + wave * 0.15 + drift * 0.2));

      const score = Math.round(
        Math.max(0, Math.min(100, rolling + noise)),
      );

      let handState: HandDetectionState = "detected";
      if (score < 28) {
        handState = "not_detected";
      } else if (score < 45) {
        handState = "partial";
      } else if (tick % 37 === 0) {
        handState = "multiple";
      }

      const confidence = Math.max(0.2, Math.min(0.99, score / 100));
      return { score, handState, confidence };
    },
  };
}
