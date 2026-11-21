import type { JSX } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { LeaderboardEntry } from "../../types/gamification";
import { colors, radii } from "../../utils/theme";

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    uid: "u-1",
    displayName: "Alex Rivera",
    avatarLetter: "A",
    xp: 3450,
    rank: 1,
    streakDays: 14,
    isCurrentUser: false,
  },
  {
    uid: "u-2",
    displayName: "Minh Chau",
    avatarLetter: "M",
    xp: 3120,
    rank: 2,
    streakDays: 12,
    isCurrentUser: false,
  },
  {
    uid: "u-3",
    displayName: "David Kim",
    avatarLetter: "D",
    xp: 2890,
    rank: 3,
    streakDays: 9,
    isCurrentUser: false,
  },
  {
    uid: "u-current",
    displayName: "You (Learner)",
    avatarLetter: "Y",
    xp: 2450,
    rank: 4,
    streakDays: 7,
    isCurrentUser: true,
  },
  {
    uid: "u-5",
    displayName: "Sarah Connor",
    avatarLetter: "S",
    xp: 2210,
    rank: 5,
    streakDays: 6,
    isCurrentUser: false,
  },
];

export function LeaderboardView(): JSX.Element {
  const topThree = MOCK_LEADERBOARD.slice(0, 3);
  const remaining = MOCK_LEADERBOARD.slice(3);

  return (
    <View style={styles.container}>
      {/* Top 3 Podium Cards */}
      <View style={styles.podium}>
        {topThree[1] && (
          <View style={[styles.podiumCol, styles.podiumSecond]}>
            <Text style={styles.podiumMedal}>🥈</Text>
            <View style={styles.podiumAvatar}>
              <Text style={styles.podiumLetter}>{topThree[1].avatarLetter}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[1].displayName.split(" ")[0]}
            </Text>
            <Text style={styles.podiumXp}>{topThree[1].xp} XP</Text>
          </View>
        )}

        {topThree[0] && (
          <View style={[styles.podiumCol, styles.podiumFirst]}>
            <Text style={styles.podiumMedal}>🥇</Text>
            <View style={[styles.podiumAvatar, styles.avatarFirst]}>
              <Text style={styles.podiumLetter}>{topThree[0].avatarLetter}</Text>
            </View>
            <Text style={[styles.podiumName, styles.nameFirst]} numberOfLines={1}>
              {topThree[0].displayName.split(" ")[0]}
            </Text>
            <Text style={styles.podiumXp}>{topThree[0].xp} XP</Text>
          </View>
        )}

        {topThree[2] && (
          <View style={[styles.podiumCol, styles.podiumThird]}>
            <Text style={styles.podiumMedal}>🥉</Text>
            <View style={styles.podiumAvatar}>
              <Text style={styles.podiumLetter}>{topThree[2].avatarLetter}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[2].displayName.split(" ")[0]}
            </Text>
            <Text style={styles.podiumXp}>{topThree[2].xp} XP</Text>
          </View>
        )}
      </View>

      {/* Ranks List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {remaining.map((entry) => (
          <View
            key={entry.uid}
            style={[
              styles.row,
              entry.isCurrentUser && styles.rowCurrent,
            ]}
          >
            <Text
              style={[
                styles.rankNum,
                entry.isCurrentUser && styles.rankNumCurrent,
              ]}
            >
              #{entry.rank}
            </Text>
            <View style={styles.rowAvatar}>
              <Text style={styles.rowAvatarText}>{entry.avatarLetter}</Text>
            </View>
            <View style={styles.rowInfo}>
              <Text
                style={[
                  styles.rowName,
                  entry.isCurrentUser && styles.rowNameCurrent,
                ]}
              >
                {entry.displayName}
              </Text>
              <Text style={styles.rowStreak}>🔥 {entry.streakDays} day streak</Text>
            </View>
            <Text style={styles.rowXp}>{entry.xp} XP</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  podiumCol: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    width: 96,
    gap: 4,
  },
  podiumFirst: {
    height: 154,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  podiumSecond: {
    height: 136,
  },
  podiumThird: {
    height: 124,
  },
  podiumMedal: {
    fontSize: 20,
  },
  podiumAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFirst: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warning,
  },
  podiumLetter: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  nameFirst: {
    fontWeight: "900",
  },
  podiumXp: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  list: {
    maxHeight: 220,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 12,
  },
  rowCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textSecondary,
    width: 28,
  },
  rankNumCurrent: {
    color: colors.primary,
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  rowNameCurrent: {
    color: colors.primary,
    fontWeight: "800",
  },
  rowStreak: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowXp: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
});
