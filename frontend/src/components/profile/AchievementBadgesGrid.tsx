import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UserBadge } from "../../types/gamification";
import { colors, radii } from "../../utils/theme";

const BADGES: UserBadge[] = [
  {
    id: "b-first-step",
    title: "First Sign",
    description: "Completed your first ASL lesson",
    icon: "🌱",
    tier: "bronze",
    progress: 100,
    unlockedAt: "2026-10-01",
  },
  {
    id: "b-streak-3",
    title: "3-Day Streak",
    description: "Practiced 3 days in a row",
    icon: "🔥",
    tier: "bronze",
    progress: 100,
    unlockedAt: "2026-10-04",
  },
  {
    id: "b-streak-7",
    title: "Week Warrior",
    description: "Practiced 7 days in a row",
    icon: "⚡",
    tier: "silver",
    progress: 100,
    unlockedAt: "2026-10-11",
  },
  {
    id: "b-vocab-20",
    title: "Sign Polyglot",
    description: "Mastered 20 vocabulary signs",
    icon: "📚",
    tier: "gold",
    progress: 80,
  },
  {
    id: "b-practice-perfect",
    title: "Camera Ace",
    description: "Scored 100% in a Practice Room session",
    icon: "🎯",
    tier: "gold",
    progress: 60,
  },
  {
    id: "b-asl-champion",
    title: "ASL Champion",
    description: "Accumulated 5,000 Total XP",
    icon: "👑",
    tier: "diamond",
    progress: 45,
  },
];

export function AchievementBadgesGrid(): JSX.Element {
  return (
    <View style={styles.grid}>
      {BADGES.map((b) => {
        const isUnlocked = Boolean(b.unlockedAt);
        return (
          <View
            key={b.id}
            style={[
              styles.badgeCard,
              !isUnlocked && styles.badgeLocked,
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                isUnlocked && styles.iconUnlocked,
              ]}
            >
              <Text style={styles.badgeIcon}>{b.icon}</Text>
            </View>
            <Text style={styles.badgeTitle}>{b.title}</Text>
            <Text style={styles.badgeDesc} numberOfLines={2}>
              {b.description}
            </Text>

            {!isUnlocked ? (
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${b.progress}%` }]}
                />
              </View>
            ) : (
              <Text style={styles.unlockedText}>✓ Unlocked</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  badgeLocked: {
    opacity: 0.7,
    backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnlocked: {
    backgroundColor: colors.primarySoft,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 15,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: radii.pill,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
    marginTop: 4,
  },
});
