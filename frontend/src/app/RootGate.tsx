import type { JSX } from "react";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthScreen } from "../features/auth/AuthScreen";
import { LearningShell } from "../features/learning/LearningShell";
import { useAuthStore } from "../stores/useAuthStore";
import { useLearningNavStore } from "../stores/useLearningNavStore";
import { colors } from "../utils/theme";

export function RootGate(): JSX.Element {
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openHome = useLearningNavStore((s) => s.openHome);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, [initAuthListener]);

  useEffect(() => {
    if (!isAuthenticated) {
      openHome();
    }
  }, [isAuthenticated, openHome]);

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

  return <LearningShell />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
