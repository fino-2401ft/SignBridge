import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LessonViewModel } from "../../types/lesson";
import { formatDuration } from "../../services/lessonService";
import { colors } from "../../utils/theme";

interface LessonListItemProps {
  item: LessonViewModel;
  onPress: (item: LessonViewModel) => void;
}

export function LessonListItem({ item, onPress }: LessonListItemProps): JSX.Element {
  const { lesson, status } = item;
  const locked = status === "locked";
  const completed = status === "completed";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${lesson.title}, ${status}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        locked && styles.locked,
        pressed && !locked && styles.pressed,
      ]}
    >
      <View style={[styles.badge, completed && styles.badgeDone, locked && styles.badgeLocked]}>
        <Text style={styles.badgeText}>
          {locked ? "🔒" : completed ? "✓" : String(lesson.order)}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.meta}>
          {formatDuration(lesson.durationSeconds)} · +{lesson.xpReward} XP
        </Text>
        <Text style={styles.gestures} numberOfLines={1}>
          {lesson.gestures.join(" · ")}
        </Text>
        <Text style={[styles.cta, locked && styles.ctaLocked, completed && styles.ctaDone]}>
          {locked
            ? "Complete previous lessons first"
            : completed
              ? "Review lesson"
              : "Start lesson"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  locked: {
    opacity: 0.72,
    backgroundColor: "#FAFBFC",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    borderColor: "#B8D4F0",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDone: {
    backgroundColor: colors.successSoft,
  },
  badgeLocked: {
    backgroundColor: "#EEF2F5",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primaryPressed,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  gestures: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cta: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  ctaLocked: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  ctaDone: {
    color: colors.success,
  },
});
