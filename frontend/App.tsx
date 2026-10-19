import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RootGate } from "./src/app/RootGate";
import { getFirebase, isFirebaseConfigured } from "./src/bootstrap";
import { colors } from "./src/utils/theme";

if (isFirebaseConfigured()) {
  getFirebase();
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
        <RootGate />
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
