import type { JSX } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MAIN_TABS, type MainTab } from "../../utils/constants";
import { colors, touchMin } from "../../utils/theme";

const TAB_ICONS: Record<MainTab, string> = {
  Learn: "⌂",
  Practice: "◎",
  Translate: "⇄",
  Dictionary: "⌕",
  Profile: "☺",
};

interface MainTabBarProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export function MainTabBar({ activeTab, onChange }: MainTabBarProps): JSX.Element {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {MAIN_TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab)}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, active && styles.iconActive]}>
              <Text style={[styles.icon, active && styles.iconTextActive]}>
                {TAB_ICONS[tab]}
              </Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    backgroundColor: colors.primarySoft,
  },
  icon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  iconTextActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
  },
});
