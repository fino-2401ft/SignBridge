import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { calculateLevelFromXp } from "../../services/xpService";
import type { UserProfile } from "../../types/user";
import { colors, radii } from "../../utils/theme";

interface UserStatsOverviewProps {
  user: UserProfile;
}

export function UserStatsOverview({ user }: UserStatsOverviewProps): JSX.Element {
  const { level, currentLevelXp, xpToNextLevel, progressPercent } =
    calculateLevelFromXp(user.totalXp);

  return (
    <View style={styles.card}>
      {/* Level Banner */}
      <View style={styles.levelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LEVEL {level}</Text>
        </View>
        <Text style={styles.xpText}>
          {user.totalXp} Total XP ({xpToNextLevel} XP to Level {level + 1})
        </Text>
      </View>

      {/* Level Progress Bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      {/* 3 Metric Columns */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{user.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>Current Rank</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{Math.round(user.totalXp / 50)}</Text>
          <Text style={styles.statLabel}>Signs Mastered</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  statBox: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  statIcon: {
    fontSize: 22,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
});
