import type { JSX } from "react";
import { useState } from "react";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";

type AuthMode = "login" | "register";

export function AuthScreen(): JSX.Element {
  const [mode, setMode] = useState<AuthMode>("login");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (mode === "register") {
    return (
      <RegisterScreen
        onGoLogin={() => {
          setSuccessMessage(null);
          setMode("login");
        }}
        onRegistered={() => {
          setSuccessMessage("Registration successful. Please log in.");
          setMode("login");
        }}
      />
    );
  }

  return (
    <LoginScreen
      onGoRegister={() => {
        setSuccessMessage(null);
        setMode("register");
      }}
      successMessage={successMessage}
      onClearSuccess={() => setSuccessMessage(null)}
    />
  );
}
