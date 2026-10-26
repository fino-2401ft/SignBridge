import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UserProfile } from "../../types/user";
import { formatXp, getLevelInfo } from "../../utils/level";
import { colors, radii } from "../../utils/theme";

interface ProgressCardProps {
  user: UserProfile;
  completedLessons: number;
  totalLessons: number;
  completedPaths: number;
  totalPaths: number;
  overallPercent: number;
}

export function ProgressCard({
  user,
  completedLessons,
  totalLessons,
  completedPaths,
  totalPaths,
  overallPercent,
}: ProgressCardProps): JSX.Element {
  const level = getLevelInfo(user.totalXp);
  const clamped = Math.max(0, Math.min(100, overallPercent));

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.head}>
        <View
          style={[styles.badge, badgeToneStyle(level.badgeTone)]}
          accessibilityLabel={`Level ${level.level}`}
        >
          <Text style={styles.badgeText}>{level.level}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text style={styles.lvl}>
            Level {level.level} · {level.tier}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Metric
          label="Streak"
          value={`${user.currentStreak} days`}
          valueColor={colors.warning}
        />
        <Metric
          label="Total XP"
          value={formatXp(user.totalXp)}
          valueColor={colors.primary}
        />
        <Metric
          label="Lessons"
          value={`${completedLessons}/${totalLessons}`}
        />
        <Metric label="Paths" value={`${completedPaths}/${totalPaths}`} />
      </View>

      <View style={styles.overallRow}>
        <Text style={styles.overallLabel}>Overall progress</Text>
        <Text style={styles.overallPct}>{clamped}%</Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
      >
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}): JSX.Element {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function badgeToneStyle(
  tone: "gray" | "bronze" | "silver" | "gold",
): { backgroundColor: string } {
  switch (tone) {
    case "gold":
      return { backgroundColor: "#D4A017" };
    case "silver":
      return { backgroundColor: "#8E9AA3" };
    case "bronze":
      return { backgroundColor: "#C68642" };
    default:
      return { backgroundColor: "#95A5A6" };
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 16,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  lvl: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  metric: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  overallPct: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  track: {
    height: 10,
    backgroundColor: "#E8ECF0",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
});
