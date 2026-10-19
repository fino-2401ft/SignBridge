import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const LoginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const RegisterFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export type AuthFormErrorCode =
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "email_in_use"
  | "invalid_credentials"
  | "too_many_attempts"
  | "network"
  | "not_configured"
  | "unknown";

export class AuthServiceError extends Error {
  readonly code: AuthFormErrorCode;
  readonly field?: "email" | "password" | "confirmPassword" | "form";

  constructor(
    code: AuthFormErrorCode,
    message: string,
    field: "email" | "password" | "confirmPassword" | "form" = "form",
  ) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.field = field;
  }
}
