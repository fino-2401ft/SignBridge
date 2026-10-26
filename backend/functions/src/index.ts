import * as admin from "firebase-admin";
import { auth } from "firebase-functions/v1";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { buildLearningCatalog } from "./learning/catalog";
import {
  completeLessonForUser,
  fetchLessonsForPath,
} from "./learning/lessons";
import { upsertPathProgress } from "./learning/progress";

admin.initializeApp();

/**
 * Bootstrap a Firestore user profile when a Firebase Auth account is created.
 */
export const onUserCreate = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email ?? "";
  const displayName = user.displayName ?? (email ? email.split("@")[0] : "Learner");

  await admin.firestore().collection("users").doc(uid).set(
    {
      uid,
      email,
      displayName,
      role: "learner",
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});

/**
 * Home screen catalog: published learning paths + the caller's path progress.
 */
export const getHomeLearningCatalog = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to load learning paths.");
  }

  return buildLearningCatalog(admin.firestore(), request.auth.uid);
});

/**
 * Lessons for a learning path (Path Detail screen).
 */
export const getLessonsForPath = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to load lessons.");
  }

  const pathId = (request.data as { pathId?: unknown }).pathId;
  if (typeof pathId !== "string" || pathId.length === 0) {
    throw new HttpsError("invalid-argument", "pathId is required.");
  }

  const lessons = await fetchLessonsForPath(admin.firestore(), pathId);
  return { pathId, lessons };
});

/**
 * Mark lesson complete: XP + path progress + user_progress (FR-004 / FR-007).
 */
export const completeLesson = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to complete a lesson.");
  }

  const lessonId = (request.data as { lessonId?: unknown }).lessonId;
  if (typeof lessonId !== "string" || lessonId.length === 0) {
    throw new HttpsError("invalid-argument", "lessonId is required.");
  }

  try {
    return await completeLessonForUser(admin.firestore(), {
      userId: request.auth.uid,
      lessonId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "LESSON_NOT_FOUND") {
      throw new HttpsError("not-found", "Lesson unavailable.");
    }
    throw new HttpsError("internal", "Could not complete lesson.");
  }
});

/**
 * Sync path-level progress after lesson completion (client fallback).
 */
export const syncPathProgress = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to sync progress.");
  }

  const data = request.data as {
    pathId?: unknown;
    completedLessonIds?: unknown;
    lessonCount?: unknown;
  };

  if (typeof data.pathId !== "string" || data.pathId.length === 0) {
    throw new HttpsError("invalid-argument", "pathId is required.");
  }

  if (!Array.isArray(data.completedLessonIds)) {
    throw new HttpsError("invalid-argument", "completedLessonIds must be an array.");
  }

  const completedLessonIds = data.completedLessonIds.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  if (typeof data.lessonCount !== "number" || data.lessonCount <= 0) {
    throw new HttpsError("invalid-argument", "lessonCount must be a positive number.");
  }

  const result = await upsertPathProgress(admin.firestore(), {
    userId: request.auth.uid,
    pathId: data.pathId,
    completedLessonIds,
    lessonCount: data.lessonCount,
  });

  return {
    pathId: data.pathId,
    progressPercent: result.progressPercent,
    completedLessonIds,
  };
});
