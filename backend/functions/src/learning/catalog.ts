import * as admin from "firebase-admin";
import type {
  LearningCatalogResponse,
  LearningPathDocument,
  PathProgressDocument,
  UnlockCondition,
} from "../types/learning";

const PATHS_COLLECTION = "learning_paths";

function parseUnlockCondition(raw: unknown): UnlockCondition {
  if (!raw || typeof raw !== "object" || !("type" in raw)) {
    return { type: "none" };
  }

  const typed = raw as { type: string; requiredPathId?: unknown; requiredXp?: unknown };
  if (typed.type === "path_complete" && typeof typed.requiredPathId === "string") {
    return { type: "path_complete", requiredPathId: typed.requiredPathId };
  }
  if (typed.type === "xp_threshold" && typeof typed.requiredXp === "number") {
    return { type: "xp_threshold", requiredXp: typed.requiredXp };
  }
  return { type: "none" };
}

function asLearningPath(
  id: string,
  data: Record<string, unknown>,
): LearningPathDocument | null {
  if (typeof data.title !== "string" || typeof data.order !== "number") {
    return null;
  }

  return {
    id,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    lessonCount:
      typeof data.lessonCount === "number" && data.lessonCount > 0
        ? data.lessonCount
        : 1,
    estimatedMinutes:
      typeof data.estimatedMinutes === "number" && data.estimatedMinutes > 0
        ? data.estimatedMinutes
        : 30,
    order: data.order,
    icon: typeof data.icon === "string" ? data.icon : "📚",
    difficultyLevel:
      data.difficultyLevel === "intermediate" || data.difficultyLevel === "advanced"
        ? data.difficultyLevel
        : "beginner",
    isPublished: data.isPublished !== false,
    unlockCondition: parseUnlockCondition(data.unlockCondition),
  };
}

export async function fetchPublishedLearningPaths(
  db: admin.firestore.Firestore,
): Promise<LearningPathDocument[]> {
  const snap = await db
    .collection(PATHS_COLLECTION)
    .where("isPublished", "==", true)
    .orderBy("order", "asc")
    .get();

  const paths: LearningPathDocument[] = [];
  for (const doc of snap.docs) {
    const parsed = asLearningPath(doc.id, doc.data() as Record<string, unknown>);
    if (parsed) {
      paths.push(parsed);
    }
  }
  return paths;
}

export async function fetchUserPathProgress(
  db: admin.firestore.Firestore,
  userId: string,
): Promise<PathProgressDocument[]> {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("path_progress")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const completedLessonIds = Array.isArray(data.completedLessonIds)
      ? data.completedLessonIds.filter((id): id is string => typeof id === "string")
      : [];
    const progressPercent =
      typeof data.progressPercent === "number"
        ? Math.max(0, Math.min(100, data.progressPercent))
        : 0;

    return {
      pathId: doc.id,
      userId,
      completedLessonIds,
      progressPercent,
    };
  });
}

export async function buildLearningCatalog(
  db: admin.firestore.Firestore,
  userId: string,
): Promise<LearningCatalogResponse> {
  const [paths, progressDocs] = await Promise.all([
    fetchPublishedLearningPaths(db),
    fetchUserPathProgress(db, userId),
  ]);

  return {
    paths,
    progress: progressDocs.map((item) => ({
      pathId: item.pathId,
      completedLessonIds: item.completedLessonIds,
      progressPercent: item.progressPercent,
    })),
  };
}
