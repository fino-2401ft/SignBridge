import type { JSX } from "react";
import { DictionaryShell } from "../features/dictionary/DictionaryShell";
import { LearningShell } from "../features/learning/LearningShell";
import { ComingSoonScreen } from "../features/shared/ComingSoonScreen";
import { useAppNavStore } from "../stores/useAppNavStore";

export function MainShell(): JSX.Element {
  const activeTab = useAppNavStore((s) => s.activeTab);

  switch (activeTab) {
    case "Dictionary":
      return <DictionaryShell />;
    case "Practice":
      return (
        <ComingSoonScreen
          tab="Practice"
          title="Practice Room"
          description="Split-screen practice with live hand tracking is next on the roadmap."
        />
      );
    case "Translate":
      return (
        <ComingSoonScreen
          tab="Translate"
          title="Live Translation"
          description="Real-time ASL → text HUD will land after the Practice Room."
        />
      );
    case "Profile":
      return (
        <ComingSoonScreen
          tab="Profile"
          title="Profile"
          description="Full profile editing is coming. Use the avatar on Learn to log out for now."
        />
      );
    case "Learn":
    default:
      return <LearningShell />;
  }
}
