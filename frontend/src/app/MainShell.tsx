import type { JSX } from "react";
import { DictionaryShell } from "../features/dictionary/DictionaryShell";
import { LearningShell } from "../features/learning/LearningShell";
import { PracticeShell } from "../features/practice/PracticeShell";
import { TranslationShell } from "../features/translation/TranslationShell";
import { ComingSoonScreen } from "../features/shared/ComingSoonScreen";
import { useAppNavStore } from "../stores/useAppNavStore";

export function MainShell(): JSX.Element {
  const activeTab = useAppNavStore((s) => s.activeTab);

  switch (activeTab) {
    case "Dictionary":
      return <DictionaryShell />;
    case "Practice":
      return <PracticeShell />;
    case "Translate":
      return <TranslationShell />;
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
