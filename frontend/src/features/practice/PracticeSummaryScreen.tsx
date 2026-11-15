import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { usePracticeStore } from "../../stores/usePracticeStore";
import { formatSessionDuration } from "../../utils/practiceFeedback";
import { colors, radii, touchMin } from "../../utils/theme";

interface PracticeSummaryScreenProps {
  sessionId: string;
}

export function PracticeSummaryScreen({
  sessionId,
}: PracticeSummaryScreenProps): JSX.Element {
  const goBackPractice = useAppNavStore((s) => s.goBackPractice);
  const openPracticeRoom = useAppNavStore((s) => s.openPracticeRoom);
  const lastSession = usePracticeStore((s) => s.lastSession);
  const clearLastSession = usePracticeStore((s) => s.clearLastSession);

  const session =
    lastSession && lastSession.sessionId === sessionId ? lastSession : lastSession;

  if (!session) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Session unavailable</Text>
        <PrimaryButton
          label="Back to Practice"
          onPress={() => {
            clearLastSession();
            goBackPractice();
          }}
        />
      </View>
    );
  }

  const topGesture = session.gestures[0];

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Practice Complete!</Text>
      <Text style={styles.subtitle}>Session {session.sessionId.slice(-6)}</Text>

      <View style={styles.card}>
        <Stat label="Duration" value={formatSessionDuration(session.durationSeconds)} />
        <Stat label="Attempts" value={String(session.totalAttempts)} />
        <Stat label="Best score" value={`${session.bestScore}%`} />
        <Stat label="Average" value={`${session.avgScore}%`} />
        <Stat label="XP earned" value={`+${session.xpEarned}`} />
      </View>

      {session.gestures.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.section}>Gestures practiced</Text>
          {session.gestures.map((item) => (
            <View key={item.gestureId} style={styles.row}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowMeta}>
                {item.attempts} tries · avg {item.avgScore}% · best {item.bestScore}%
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No scored attempts were recorded.</Text>
      )}

      <PrimaryButton
        label="Done"
        onPress={() => {
          clearLastSession();
          goBackPractice();
        }}
      />

      {topGesture ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearLastSession();
            openPracticeRoom(topGesture.gestureId);
          }}
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryText}>Practice again →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 28,
  },
  emoji: {
    fontSize: 40,
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stat: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  list: {
    marginTop: 18,
    marginBottom: 8,
  },
  section: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  empty: {
    marginVertical: 16,
    textAlign: "center",
    color: colors.textSecondary,
  },
  secondary: {
    marginTop: 12,
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryPressed: {
    borderColor: colors.primary,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
});
