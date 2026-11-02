import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureDTO } from "../../types/gesture";
import { categoryDisplayName } from "../../types/gesture";
import { colors } from "../../utils/theme";

interface GestureCardProps {
  gesture: GestureDTO;
  onPress: (gesture: GestureDTO) => void;
}

export function GestureCard({ gesture, onPress }: GestureCardProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${gesture.label}, ${categoryDisplayName(gesture.category)}`}
      onPress={() => onPress(gesture)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <Text style={styles.thumbIcon}>▶️</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{gesture.label}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {gesture.description || gesture.alternatives.join(", ") || "ASL gesture"}
        </Text>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {categoryDisplayName(gesture.category)}
            </Text>
          </View>
          <Text style={styles.difficulty}>{gesture.difficulty}</Text>
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
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    borderColor: "#B8D4F0",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: {
    fontSize: 20,
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
  row: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
});
