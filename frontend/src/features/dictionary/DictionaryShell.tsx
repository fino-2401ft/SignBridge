import type { JSX } from "react";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { DictionaryScreen } from "./DictionaryScreen";
import { GestureDetailScreen } from "./GestureDetailScreen";

export function DictionaryShell(): JSX.Element {
  const dictionaryRoute = useAppNavStore((s) => s.dictionaryRoute);

  if (dictionaryRoute.name === "detail") {
    return <GestureDetailScreen gestureId={dictionaryRoute.gestureId} />;
  }

  return <DictionaryScreen />;
}
