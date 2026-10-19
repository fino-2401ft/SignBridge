import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthBanner } from "../../components/ui/AuthBanner";
import { AuthTextField } from "../../components/ui/AuthTextField";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  AuthServiceError,
  RegisterFormSchema,
  type RegisterFormValues,
} from "../../types";
import { colors } from "../../utils/theme";

interface RegisterScreenProps {
  onGoLogin: () => void;
  onRegistered: (email: string) => void;
}

export function RegisterScreen({
  onGoLogin,
  onRegistered,
}: RegisterScreenProps): JSX.Element {
  const register = useAuthStore((s) => s.register);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register(values);
      onRegistered(values.email.trim());
    } catch (error) {
      setValue("password", "");
      setValue("confirmPassword", "");
      if (error instanceof AuthServiceError) {
        if (error.field === "email") {
          setError("email", { message: error.message });
        } else if (error.field === "password") {
          setError("password", { message: error.message });
        } else if (error.field === "confirmPassword") {
          setError("confirmPassword", { message: error.message });
        } else {
          setFormError(error.message);
        }
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Connection error. Please try again.",
      );
      // Preserve email on failure (FR-001 recovery).
      void getValues("email");
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroGlow} pointerEvents="none" />

        <View style={styles.brandBlock}>
          <Text style={styles.brand}>
            Create<Text style={styles.brandAccent}> account</Text>
          </Text>
          <Text style={styles.tagline}>
            Join SignBridge to learn and practice ASL.
          </Text>
        </View>

        <View style={styles.form}>
          <AuthBanner message={formError} tone="error" />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
                editable={!isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Password"
                placeholder="Min 8 chars, mixed case + number"
                isPassword
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                editable={!isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Confirm password"
                placeholder="Re-enter password"
                isPassword
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                editable={!isSubmitting}
              />
            )}
          />

          <PrimaryButton
            label="Register"
            onPress={() => {
              void onSubmit();
            }}
            loading={isSubmitting}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={onGoLogin} disabled={isSubmitting}>
            <Text style={styles.footerLink}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 36,
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    right: -80,
    width: 260,
    height: 260,
    backgroundColor: "rgba(39, 174, 96, 0.12)",
    borderRadius: 200,
  },
  brandBlock: {
    marginTop: 20,
    marginBottom: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 280,
  },
  form: {
    gap: 4,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
});
