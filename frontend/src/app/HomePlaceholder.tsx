import type { JSX } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthBanner } from "../components/ui/AuthBanner";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useAuthStore } from "../stores/useAuthStore";
import { colors } from "../utils/theme";

const TABS = ["Learn", "Practice", "Translate", "Dictionary", "Profile"] as const;

export function HomePlaceholder(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const [error, setError] = useState<string | null>(null);

  const onLogout = async (): Promise<void> => {
    setError(null);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log out.");
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>SignBridge</Text>
      <Text style={styles.subtitle}>
        Welcome{user?.displayName ? `, ${user.displayName}` : ""}
      </Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

      <AuthBanner message={error} tone="error" />

      <Text style={styles.section}>Upcoming bottom tabs</Text>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable key={tab} style={styles.tabChip}>
            <Text style={styles.tabLabel}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.logoutWrap}>
        <PrimaryButton label="Log out" onPress={onLogout} loading={isSubmitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  section: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
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
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabLabel: {
    color: colors.primaryPressed,
    fontWeight: "700",
    fontSize: 13,
  },
  logoutWrap: {
    marginTop: 28,
    width: "100%",
    maxWidth: 280,
  },
});
