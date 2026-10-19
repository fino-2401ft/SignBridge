import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { HomePlaceholder } from "./src/app/HomePlaceholder";
import { getFirebase, isFirebaseConfigured } from "./src/bootstrap";

// Eagerly attempt Firebase init when env is present (no-op if missing).
if (isFirebaseConfigured()) {
  getFirebase();
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <HomePlaceholder />
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
