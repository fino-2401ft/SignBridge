import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LearningPathViewModel } from "../../types/learning";
import { colors, radii } from "../../utils/theme";

interface LearningPathCardProps {
  item: LearningPathViewModel;
  onPress: (item: LearningPathViewModel) => void;
}

export function LearningPathCard({
  item,
  onPress,
}: LearningPathCardProps): JSX.Element {
  const { path, locked, progressPercent, ctaLabel } = item;
  const showBar = !locked;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${path.title}${locked ? ", locked" : ""}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        locked && styles.locked,
        pressed && !locked && styles.pressed,
      ]}
    >
      <View style={[styles.icon, locked && styles.iconLocked]}>
        <Text style={styles.iconText}>{locked ? "🔒" : path.icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{path.title}</Text>
        <Text style={styles.meta}>
          {path.lessonCount} lessons · {path.estimatedMinutes} min
        </Text>
        {showBar ? (
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
              ]}
            />
          </View>
        ) : null}
        <View style={styles.ctaRow}>
          <Text style={[styles.cta, locked && styles.ctaLocked]}>{ctaLabel}</Text>
          {!locked && progressPercent > 0 && progressPercent < 100 ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{progressPercent}%</Text>
            </View>
          ) : null}
        </View>
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
    opacity: 0.78,
    backgroundColor: "#FAFBFC",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    borderColor: "#B8D4F0",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLocked: {
    backgroundColor: "#EEF2F5",
  },
  iconText: {
    fontSize: 22,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  track: {
    marginTop: 10,
    height: 8,
    backgroundColor: "#E8ECF0",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  ctaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cta: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  ctaLocked: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  pill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
});
