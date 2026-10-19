import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../utils/theme";

export type AuthBannerTone = "error" | "success" | "warning" | "info";

interface AuthBannerProps {
  message: string | null;
  tone?: AuthBannerTone;
}

export function AuthBanner({
  message,
  tone = "error",
}: AuthBannerProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.banner, styles[tone]]} accessibilityRole="alert">
      <Text style={[styles.text, styles[`${tone}Text`]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.md - 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  error: { backgroundColor: colors.errorSoft },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  info: { backgroundColor: "#EEF2F5" },
  errorText: { color: "#C0392B" },
  successText: { color: "#1E8449" },
  warningText: { color: "#B9770E" },
  infoText: { color: colors.text },
});
