import * as admin from "firebase-admin";

export interface UpsertPathProgressInput {
  userId: string;
  pathId: string;
  completedLessonIds: string[];
  lessonCount: number;
}

/**
 * Writes path-level progress under users/{uid}/path_progress/{pathId}.
 * Used by callable sync + future lesson-complete triggers.
 */
export async function upsertPathProgress(
  db: admin.firestore.Firestore,
  input: UpsertPathProgressInput,
): Promise<{ progressPercent: number }> {
  const uniqueLessons = Array.from(new Set(input.completedLessonIds));
  const progressPercent =
    input.lessonCount > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((uniqueLessons.length / input.lessonCount) * 100)),
        )
      : 0;

  await db
    .collection("users")
    .doc(input.userId)
    .collection("path_progress")
    .doc(input.pathId)
    .set(
      {
        pathId: input.pathId,
        userId: input.userId,
        completedLessonIds: uniqueLessons,
        progressPercent,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { progressPercent };
}
