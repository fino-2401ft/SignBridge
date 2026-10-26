export type LevelTier = "Starter" | "White" | "Bronze" | "Silver" | "Gold";

export interface LevelInfo {
  level: number;
  tier: LevelTier;
  badgeTone: "gray" | "bronze" | "silver" | "gold";
}

/** FR-008 level ladder: every 100 XP early tiers, then +500 XP per level after Gold. */
export function getLevelInfo(totalXp: number): LevelInfo {
  if (totalXp >= 1000) {
    const extra = Math.floor((totalXp - 1000) / 500);
    return { level: 5 + extra, tier: "Gold", badgeTone: "gold" };
  }
  if (totalXp >= 500) {
    return { level: 4, tier: "Silver", badgeTone: "silver" };
  }
  if (totalXp >= 250) {
    return { level: 3, tier: "Bronze", badgeTone: "bronze" };
  }
  if (totalXp >= 100) {
    return { level: 2, tier: "White", badgeTone: "gray" };
  }
  return { level: 1, tier: "Starter", badgeTone: "gray" };
}

export function formatXp(totalXp: number): string {
  return totalXp.toLocaleString("en-US");
}
