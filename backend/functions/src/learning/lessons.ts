import * as admin from "firebase-admin";
import type { CompleteLessonResponse, LessonDocument } from "../types/lesson";
import { upsertPathProgress } from "./progress";

function getLevelFromXp(totalXp: number): number {
  if (totalXp >= 1000) {
    return 5 + Math.floor((totalXp - 1000) / 500);
  }
  if (totalXp >= 500) {
    return 4;
  }
  if (totalXp >= 250) {
    return 3;
  }
  if (totalXp >= 100) {
    return 2;
  }
  return 1;
}

function asLesson(
  id: string,
  data: Record<string, unknown>,
): LessonDocument | null {
  if (
    typeof data.pathId !== "string" ||
    typeof data.title !== "string" ||
    typeof data.order !== "number"
  ) {
    return null;
  }

  const gestures = Array.isArray(data.gestures)
    ? data.gestures.filter((g): g is string => typeof g === "string")
    : [];

  return {
    id,
    pathId: data.pathId,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
    thumbnailUrl:
      typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : undefined,
    durationSeconds:
      typeof data.durationSeconds === "number" && data.durationSeconds > 0
        ? data.durationSeconds
        : 120,
    xpReward:
      typeof data.xpReward === "number" && data.xpReward > 0 ? data.xpReward : 10,
    gestures: gestures.length > 0 ? gestures : ["ASL"],
    order: data.order,
    isPublished: data.isPublished !== false,
  };
}

export async function fetchLessonsForPath(
  db: admin.firestore.Firestore,
  pathId: string,
): Promise<LessonDocument[]> {
  const snap = await db
    .collection("lessons")
    .where("pathId", "==", pathId)
    .where("isPublished", "==", true)
    .orderBy("order", "asc")
    .get();

  const lessons: LessonDocument[] = [];
  for (const doc of snap.docs) {
    const parsed = asLesson(doc.id, doc.data() as Record<string, unknown>);
    if (parsed) {
      lessons.push(parsed);
    }
  }
  return lessons;
}

export async function completeLessonForUser(
  db: admin.firestore.Firestore,
  params: { userId: string; lessonId: string },
): Promise<CompleteLessonResponse> {
  const lessonRef = db.collection("lessons").doc(params.lessonId);
  const lessonSnap = await lessonRef.get();
  if (!lessonSnap.exists) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const lesson = asLesson(
    lessonSnap.id,
    lessonSnap.data() as Record<string, unknown>,
  );
  if (!lesson || !lesson.isPublished) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const pathRef = db.collection("learning_paths").doc(lesson.pathId);
  const pathSnap = await pathRef.get();
  const lessonCount =
    pathSnap.exists && typeof pathSnap.data()?.lessonCount === "number"
      ? (pathSnap.data()?.lessonCount as number)
      : lesson.order;

  const progressRef = db
    .collection("users")
    .doc(params.userId)
    .collection("path_progress")
    .doc(lesson.pathId);
  const progressSnap = await progressRef.get();
  const existingIds = Array.isArray(progressSnap.data()?.completedLessonIds)
    ? (progressSnap.data()?.completedLessonIds as unknown[]).filter(
        (id): id is string => typeof id === "string",
      )
    : [];

  const alreadyCompleted = existingIds.includes(lesson.id);
  const completedLessonIds = alreadyCompleted
    ? existingIds
    : Array.from(new Set([...existingIds, lesson.id]));

  const progress = await upsertPathProgress(db, {
    userId: params.userId,
    pathId: lesson.pathId,
    completedLessonIds,
    lessonCount,
  });

  const userRef = db.collection("users").doc(params.userId);
  const userSnap = await userRef.get();
  const currentXp =
    userSnap.exists && typeof userSnap.data()?.totalXp === "number"
      ? (userSnap.data()?.totalXp as number)
      : 0;

  let awardedXp = 0;
  let pathBonusXp = 0;
  let totalXp = currentXp;

  if (!alreadyCompleted) {
    awardedXp = lesson.xpReward;
    if (progress.progressPercent >= 100) {
      pathBonusXp = 50;
    }
    totalXp = currentXp + awardedXp + pathBonusXp;
    const currentLevel = getLevelFromXp(totalXp);

    await userRef.set(
      {
        totalXp,
        currentLevel,
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const progressDocId = `${params.userId}_${lesson.id}`;
  const progressPayload: Record<string, unknown> = {
    id: progressDocId,
    userId: params.userId,
    lessonId: lesson.id,
    pathId: lesson.pathId,
    status: "completed",
    bestAccuracy: 100,
    stars: 3,
    attemptsCount: admin.firestore.FieldValue.increment(1),
    lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!alreadyCompleted) {
    progressPayload.firstCompletedAt = admin.firestore.FieldValue.serverTimestamp();
  }
  await db.collection("user_progress").doc(progressDocId).set(progressPayload, {
    merge: true,
  });

  return {
    lessonId: lesson.id,
    pathId: lesson.pathId,
    awardedXp: alreadyCompleted ? 0 : awardedXp,
    totalXp,
    currentLevel: getLevelFromXp(totalXp),
    progressPercent: progress.progressPercent,
    completedLessonIds,
    alreadyCompleted,
    pathBonusXp: alreadyCompleted ? 0 : pathBonusXp,
  };
}
