import type { JSX } from "react";
import { useLearningNavStore } from "../../stores/useLearningNavStore";
import { HomeScreen } from "./HomeScreen";
import { LessonScreen } from "./LessonScreen";
import { PathDetailScreen } from "./PathDetailScreen";

export function LearningShell(): JSX.Element {
  const route = useLearningNavStore((s) => s.route);

  if (route.name === "path") {
    return <PathDetailScreen pathId={route.pathId} />;
  }

  if (route.name === "lesson") {
    return <LessonScreen pathId={route.pathId} lessonId={route.lessonId} />;
  }

  return <HomeScreen />;
}
