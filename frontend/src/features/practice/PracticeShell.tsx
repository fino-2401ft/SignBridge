import type { JSX } from "react";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { PracticeListScreen } from "./PracticeListScreen";
import { PracticeRoomScreen } from "./PracticeRoomScreen";
import { PracticeSummaryScreen } from "./PracticeSummaryScreen";

export function PracticeShell(): JSX.Element {
  const practiceRoute = useAppNavStore((s) => s.practiceRoute);

  if (practiceRoute.name === "room") {
    return <PracticeRoomScreen gestureId={practiceRoute.gestureId} />;
  }

  if (practiceRoute.name === "summary") {
    return <PracticeSummaryScreen sessionId={practiceRoute.sessionId} />;
  }

  return <PracticeListScreen />;
}
