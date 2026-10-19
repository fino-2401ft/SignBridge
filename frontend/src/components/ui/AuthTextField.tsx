import type { JSX } from "react";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors, radii, touchMin } from "../../utils/theme";

interface AuthTextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthTextField({
  label,
  error,
  isPassword = false,
  ...inputProps
}: AuthTextFieldProps): JSX.Element {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, hasError && styles.inputWrapError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={isPassword ? "none" : inputProps.autoCapitalize}
          autoCorrect={false}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            style={styles.toggle}
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <Text style={styles.toggleText}>{visible ? "Hide" : "Show"}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.error}>{error ?? " "}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    minHeight: touchMin,
  },
  inputWrapError: {
    borderColor: colors.error,
  },
  input: {
    minHeight: touchMin,
    paddingHorizontal: 16,
    paddingRight: 64,
    fontSize: 16,
    color: colors.text,
  },
  toggle: {
    position: "absolute",
    right: 8,
    height: 40,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderRadius: 10,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  error: {
    minHeight: 18,
    fontSize: 13,
    fontWeight: "500",
    color: colors.error,
  },
});
