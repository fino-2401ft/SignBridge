import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";

const TABS = ["Learn", "Practice", "Translate", "Dictionary", "Profile"] as const;

export function HomePlaceholder(): JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.brand}>SignBridge</Text>
      <Text style={styles.subtitle}>
        AI-driven ASL recognition & accessible learning
      </Text>
      <Text style={styles.section}>Upcoming bottom tabs</Text>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <View key={tab} style={styles.tabChip}>
            <Text style={styles.tabLabel}>{tab}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        Scaffold ready. Auth & navigation land in ROADMAP Prompt 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2C3E50",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginTop: 28,
    fontSize: 12,
    fontWeight: "700",
    color: "#7F8C8D",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tabRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  tabChip: {
    backgroundColor: "#E8F1FA",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabLabel: {
    color: "#357ABD",
    fontWeight: "700",
    fontSize: 13,
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: "#95A5A6",
    textAlign: "center",
    lineHeight: 18,
  },
});
