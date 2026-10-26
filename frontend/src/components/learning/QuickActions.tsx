import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MainTab } from "../../utils/constants";
import { colors, touchMin } from "../../utils/theme";

interface QuickAction {
  key: Extract<MainTab, "Practice" | "Translate" | "Dictionary">;
  label: string;
  icon: string;
  iconBg: string;
}

const ACTIONS: QuickAction[] = [
  { key: "Practice", label: "Practice", icon: "◎", iconBg: colors.successSoft },
  { key: "Translate", label: "Translate", icon: "⇄", iconBg: colors.primarySoft },
  { key: "Dictionary", label: "Dictionary", icon: "⌕", iconBg: colors.warningSoft },
];

interface QuickActionsProps {
  onSelect: (tab: QuickAction["key"]) => void;
}

export function QuickActions({ onSelect }: QuickActionsProps): JSX.Element {
  return (
    <View style={styles.row} accessibilityRole="menu">
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="menuitem"
          accessibilityLabel={action.label}
          onPress={() => onSelect(action.key)}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: touchMin + 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
    color: colors.text,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.1,
  },
});
