import { describe, test, expect } from "./testHarness";
import { calculateSM2 } from "../utils/spacedRepetition";
import type { FlashCardItem } from "../types/gamification";

describe("spacedRepetition SM-2", () => {
  const baseCard: FlashCardItem = {
    signId: "sign-1",
    title: "Hello",
    category: "Greetings",
    emoji: "👋",
    videoUrl: "https://example.com/hello.mp4",
    description: "Standard greeting",
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
    mastered: false,
  };

  test("initial successful review sets interval to 1 day", () => {
    const result = calculateSM2(baseCard, 4);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  test("second successful review sets interval to 6 days", () => {
    const cardSecond: FlashCardItem = { ...baseCard, repetitions: 1, intervalDays: 1 };
    const result = calculateSM2(cardSecond, 5);
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
  });

  test("third successful review scales interval by easeFactor", () => {
    const cardThird: FlashCardItem = { ...baseCard, repetitions: 2, intervalDays: 6, easeFactor: 2.5 };
    const result = calculateSM2(cardThird, 4);
    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(15); // Math.round(6 * 2.5)
  });

  test("failed review resets repetitions to 0 and interval to 1", () => {
    const cardAdvanced: FlashCardItem = { ...baseCard, repetitions: 4, intervalDays: 30, easeFactor: 2.6 };
    const result = calculateSM2(cardAdvanced, 1);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.mastered).toBe(false);
  });
});
