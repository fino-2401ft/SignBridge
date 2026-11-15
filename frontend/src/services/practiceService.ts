import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import type { PracticeGestureStat, PracticeSession } from "../types/practice";
import { PracticeSessionSchema } from "../types/practice";
import { isFirebaseConfigured } from "../utils/env";
import { getFirebase, requireFirebase } from "./firebase";

function createSessionId(): string {
  return `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function buildPracticeSession(params: {
  userId: string;
  startTime: Date;
  endTime: Date;
  gestureStats: PracticeGestureStat[];
}): PracticeSession {
  const durationSeconds = Math.max(
    0,
    Math.round((params.endTime.getTime() - params.startTime.getTime()) / 1000),
  );
  const totalAttempts = params.gestureStats.reduce(
    (sum, item) => sum + item.attempts,
    0,
  );
  const bestScore =
    params.gestureStats.length > 0
      ? Math.max(...params.gestureStats.map((item) => item.bestScore))
      : 0;
  const avgScore =
    totalAttempts > 0
      ? Math.round(
          params.gestureStats.reduce(
            (sum, item) => sum + item.avgScore * item.attempts,
            0,
          ) / totalAttempts,
        )
      : 0;
  const xpEarned = totalAttempts >= 5 ? 2 : totalAttempts > 0 ? 1 : 0;

  return PracticeSessionSchema.parse({
    sessionId: createSessionId(),
    userId: params.userId,
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    durationSeconds,
    gestures: params.gestureStats,
    totalAttempts,
    avgScore,
    bestScore,
    xpEarned,
  });
}

export async function savePracticeSession(
  session: PracticeSession,
): Promise<{ saved: boolean; source: "firestore" | "local" }> {
  if (!isFirebaseConfigured() || !getFirebase()) {
    return { saved: false, source: "local" };
  }

  try {
    const { db } = requireFirebase();
    await addDoc(collection(db, "practice_sessions"), {
      ...session,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { saved: true, source: "firestore" };
  } catch {
    return { saved: false, source: "local" };
  }
}
