import type { JSX } from "react";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthScreen } from "../features/auth/AuthScreen";
import { useAppNavStore } from "../stores/useAppNavStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useLearningNavStore } from "../stores/useLearningNavStore";
import { colors } from "../utils/theme";
import { MainShell } from "./MainShell";

export function RootGate(): JSX.Element {
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openHome = useLearningNavStore((s) => s.openHome);
  const resetAppNav = useAppNavStore((s) => s.reset);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, [initAuthListener]);

  useEffect(() => {
    if (!isAuthenticated) {
      openHome();
      resetAppNav();
    }
  }, [isAuthenticated, openHome, resetAppNav]);

  if (!authReady || isLoading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainShell />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
