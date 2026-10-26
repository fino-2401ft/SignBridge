import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { LearningPath, PathProgress } from "../types/learning";
import { LearningPathSchema, PathProgressSchema } from "../types/learning";
import { isFirebaseConfigured } from "../utils/env";
import { getFirebase, requireFirebase } from "./firebase";

/** Local fallback when Firebase is not configured or catalog is empty. */
const DEMO_PATHS: LearningPath[] = [
  {
    id: "path-basics",
    title: "ASL Basics",
    lessonCount: 8,
    estimatedMinutes: 60,
    order: 1,
    icon: "👋",
    unlockCondition: { type: "none" },
  },
  {
    id: "path-everyday",
    title: "Everyday Communication",
    lessonCount: 8,
    estimatedMinutes: 70,
    order: 2,
    icon: "💬",
    unlockCondition: {
      type: "path_complete",
      requiredPathId: "path-basics",
    },
  },
  {
    id: "path-advanced",
    title: "Advanced Conversations",
    lessonCount: 8,
    estimatedMinutes: 80,
    order: 3,
    icon: "🗣️",
    unlockCondition: {
      type: "path_complete",
      requiredPathId: "path-everyday",
    },
  },
  {
    id: "path-emergency",
    title: "Emergency Phrases",
    lessonCount: 4,
    estimatedMinutes: 25,
    order: 4,
    icon: "🆘",
    unlockCondition: {
      type: "xp_threshold",
      requiredXp: 1500,
    },
  },
];

const DEMO_PROGRESS: PathProgress[] = [
  {
    pathId: "path-basics",
    completedLessonIds: [
      "lesson-basics-01",
      "lesson-basics-02",
      "lesson-basics-03",
      "lesson-basics-04",
      "lesson-basics-05",
      "lesson-basics-06",
      "lesson-basics-07",
      "lesson-basics-08",
    ],
    progressPercent: 100,
  },
  {
    pathId: "path-everyday",
    completedLessonIds: ["lesson-everyday-01", "lesson-everyday-02"],
    progressPercent: 25,
  },
  {
    pathId: "path-advanced",
    completedLessonIds: [],
    progressPercent: 0,
  },
  {
    pathId: "path-emergency",
    completedLessonIds: [],
    progressPercent: 0,
  },
];

export interface LearningCatalogResult {
  paths: LearningPath[];
  progress: PathProgress[];
  source: "firestore" | "callable" | "demo";
}

function demoCatalog(): LearningCatalogResult {
  return {
    paths: DEMO_PATHS.map((item) => LearningPathSchema.parse(item)).sort(
      (a, b) => a.order - b.order,
    ),
    progress: DEMO_PROGRESS.map((item) => PathProgressSchema.parse(item)),
    source: "demo",
  };
}

function mapPathDoc(id: string, data: Record<string, unknown>): LearningPath | null {
  try {
    return LearningPathSchema.parse({
      id,
      title: data.title,
      lessonCount: data.lessonCount,
      estimatedMinutes: data.estimatedMinutes,
      order: data.order,
      icon: data.icon ?? "📚",
      unlockCondition: data.unlockCondition ?? { type: "none" },
    });
  } catch {
    return null;
  }
}

function mapProgressDoc(id: string, data: Record<string, unknown>): PathProgress | null {
  try {
    return PathProgressSchema.parse({
      pathId: id,
      completedLessonIds: data.completedLessonIds ?? [],
      progressPercent: data.progressPercent ?? 0,
    });
  } catch {
    return null;
  }
}

async function fetchCatalogFromFirestore(userId: string): Promise<LearningCatalogResult> {
  const { db } = requireFirebase();

  const pathsQuery = query(
    collection(db, "learning_paths"),
    where("isPublished", "==", true),
    orderBy("order", "asc"),
  );
  const pathsSnap = await getDocs(pathsQuery);
  const paths: LearningPath[] = [];
  for (const pathDoc of pathsSnap.docs) {
    const mapped = mapPathDoc(pathDoc.id, pathDoc.data() as Record<string, unknown>);
    if (mapped) {
      paths.push(mapped);
    }
  }

  const progressSnap = await getDocs(
    collection(doc(db, "users", userId), "path_progress"),
  );
  const progress: PathProgress[] = [];
  for (const progressDoc of progressSnap.docs) {
    const mapped = mapProgressDoc(
      progressDoc.id,
      progressDoc.data() as Record<string, unknown>,
    );
    if (mapped) {
      progress.push(mapped);
    }
  }

  if (paths.length === 0) {
    return demoCatalog();
  }

  return { paths, progress, source: "firestore" };
}

async function fetchCatalogFromCallable(): Promise<LearningCatalogResult> {
  const { app } = requireFirebase();
  const functions = getFunctions(app);
  const callable = httpsCallable<undefined, {
    paths: Array<Record<string, unknown>>;
    progress: Array<Record<string, unknown>>;
  }>(functions, "getHomeLearningCatalog");

  const result = await callable();
  const paths: LearningPath[] = [];
  for (const raw of result.data.paths ?? []) {
    const id = typeof raw.id === "string" ? raw.id : "";
    const mapped = mapPathDoc(id, raw);
    if (mapped) {
      paths.push(mapped);
    }
  }

  const progress: PathProgress[] = [];
  for (const raw of result.data.progress ?? []) {
    const pathId = typeof raw.pathId === "string" ? raw.pathId : "";
    const mapped = mapProgressDoc(pathId, raw);
    if (mapped) {
      progress.push(mapped);
    }
  }

  if (paths.length === 0) {
    return demoCatalog();
  }

  return {
    paths: paths.sort((a, b) => a.order - b.order),
    progress,
    source: "callable",
  };
}

/**
 * Loads Home learning catalog.
 * Prefer direct Firestore (offline cache). Fall back to callable, then local demo.
 */
export async function fetchLearningCatalog(
  userId?: string | null,
): Promise<LearningCatalogResult> {
  if (!isFirebaseConfigured() || !getFirebase()) {
    return demoCatalog();
  }

  if (userId) {
    try {
      return await fetchCatalogFromFirestore(userId);
    } catch {
      // Composite index missing / rules / network — try Cloud Function next.
    }
  }

  try {
    return await fetchCatalogFromCallable();
  } catch {
    return demoCatalog();
  }
}
