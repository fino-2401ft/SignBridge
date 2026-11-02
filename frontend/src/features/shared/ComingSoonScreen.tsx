import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { useAppNavStore } from "../../stores/useAppNavStore";
import type { MainTab } from "../../utils/constants";
import { colors } from "../../utils/theme";

interface ComingSoonScreenProps {
  title: string;
  description: string;
  tab: MainTab;
}

export function ComingSoonScreen({
  title,
  description,
  tab,
}: ComingSoonScreenProps): JSX.Element {
  const setTab = useAppNavStore((s) => s.setTab);

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
      </View>
      <MainTabBar activeTab={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  text: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
