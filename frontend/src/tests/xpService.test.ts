import { describe, test, expect } from "./testHarness";
import { calculateLevelFromXp, computeStreak } from "../services/xpService";

describe("xpService", () => {
  test("calculates level 1 for 0 to 250 XP", () => {
    const lvl0 = calculateLevelFromXp(0);
    expect(lvl0.level).toBe(1);
    expect(lvl0.progressPercent).toBe(0);

    const lvlHalf = calculateLevelFromXp(125);
    expect(lvlHalf.level).toBe(1);
    expect(lvlHalf.progressPercent).toBe(50);
  });

  test("levels up progressively as XP increases", () => {
    const lvl2 = calculateLevelFromXp(300);
    expect(lvl2.level).toBe(2);
    expect(lvl2.currentLevelXp).toBe(50);

    const highLvl = calculateLevelFromXp(2000);
    expect(highLvl.level).toBeGreaterThan(3);
  });

  test("increments streak when practiced on the consecutive day", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = computeStreak(3, yesterday);
    expect(result.newStreak).toBe(4);
    expect(result.streakMaintained).toBe(true);
  });

  test("maintains streak when practiced multiple times on same day", () => {
    const today = new Date().toISOString();
    const result = computeStreak(5, today);
    expect(result.newStreak).toBe(5);
    expect(result.streakMaintained).toBe(true);
  });

  test("resets streak to 1 if more than 1 day skipped", () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
    const result = computeStreak(7, twoDaysAgo);
    expect(result.newStreak).toBe(1);
    expect(result.streakMaintained).toBe(false);
  });
});
