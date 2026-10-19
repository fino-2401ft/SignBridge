import type { JSX } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";
import { colors, radii, touchMin } from "../../utils/theme";

interface PrimaryButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  loading?: boolean;
}

export function PrimaryButton({
  label,
  loading = false,
  disabled,
  ...props
}: PrimaryButtonProps): JSX.Element {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
      <Text style={styles.label}>{loading ? "Please wait…" : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
    minHeight: touchMin,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
