import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useEffect, useState } from "react";
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
  LoginFormSchema,
  type LoginFormValues,
} from "../../types";
import { colors } from "../../utils/theme";

interface LoginScreenProps {
  onGoRegister: () => void;
  successMessage?: string | null;
  onClearSuccess?: () => void;
}

export function LoginScreen({
  onGoRegister,
  successMessage = null,
  onClearSuccess,
}: LoginScreenProps): JSX.Element {
  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const pendingLoginEmail = useAuthStore((s) => s.pendingLoginEmail);
  const isLockedOut = useAuthStore((s) => s.isLockedOut);
  const remainingLockoutSeconds = useAuthStore((s) => s.remainingLockoutSeconds);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockTick, setLockTick] = useState(0);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: pendingLoginEmail ?? "",
      password: "",
    },
  });

  useEffect(() => {
    if (pendingLoginEmail) {
      setValue("email", pendingLoginEmail);
    }
  }, [pendingLoginEmail, setValue]);

  useEffect(() => {
    if (!isLockedOut()) {
      return;
    }
    const id = setInterval(() => setLockTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [isLockedOut, lockTick]);

  const locked = isLockedOut();
  const lockSeconds = remainingLockoutSeconds();

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    onClearSuccess?.();
    try {
      await login(values);
    } catch (error) {
      setValue("password", "");
      if (error instanceof AuthServiceError) {
        if (error.field === "email") {
          setError("email", { message: error.message });
        } else if (error.field === "password") {
          setError("password", { message: error.message });
        } else {
          setFormError(error.message);
        }
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Connection error. Check your network.",
      );
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
            Sign<Text style={styles.brandAccent}>Bridge</Text>
          </Text>
          <Text style={styles.tagline}>Learn ASL. Connect in real time.</Text>
        </View>

        <View style={styles.form}>
          <AuthBanner message={successMessage} tone="success" />
          <AuthBanner
            message={
              locked
                ? `Too many attempts. Try again in ${lockSeconds}s.`
                : formError
            }
            tone={locked ? "warning" : "error"}
          />

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
                editable={!isSubmitting && !locked}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Password"
                placeholder="Your password"
                isPassword
                autoComplete="password"
                textContentType="password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                editable={!isSubmitting && !locked}
              />
            )}
          />

          <PrimaryButton
            label="Log in"
            onPress={() => {
              void onSubmit();
            }}
            loading={isSubmitting}
            disabled={locked}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to SignBridge? </Text>
          <Pressable onPress={onGoRegister} disabled={isSubmitting}>
            <Text style={styles.footerLink}>Create account</Text>
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
    left: -60,
    right: -40,
    height: 280,
    backgroundColor: "rgba(74, 144, 226, 0.16)",
    borderRadius: 200,
  },
  brandBlock: {
    marginTop: 20,
    marginBottom: 32,
  },
  brand: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    maxWidth: 220,
    lineHeight: 22,
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
