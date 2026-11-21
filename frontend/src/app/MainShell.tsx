import type { JSX } from "react";
import { DictionaryShell } from "../features/dictionary/DictionaryShell";
import { LearningShell } from "../features/learning/LearningShell";
import { PracticeShell } from "../features/practice/PracticeShell";
import { ProfileShell } from "../features/profile/ProfileShell";
import { TranslationShell } from "../features/translation/TranslationShell";
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
      return <ProfileShell />;
    case "Learn":
    default:
      return <LearningShell />;
  }
}
