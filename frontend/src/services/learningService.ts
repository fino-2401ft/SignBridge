import type { LearningPath, PathProgress } from "../types/learning";
import { LearningPathSchema, PathProgressSchema } from "../types/learning";

/** Seed curriculum aligned with project-context §5.2 (MVP demo until Firestore is wired). */
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
    completedLessonIds: ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"],
    progressPercent: 100,
  },
  {
    pathId: "path-everyday",
    completedLessonIds: ["l1", "l2"],
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface LearningCatalogResult {
  paths: LearningPath[];
  progress: PathProgress[];
}

export async function fetchLearningCatalog(): Promise<LearningCatalogResult> {
  await delay(450);

  const paths = DEMO_PATHS.map((item) => LearningPathSchema.parse(item)).sort(
    (a, b) => a.order - b.order,
  );
  const progress = DEMO_PROGRESS.map((item) => PathProgressSchema.parse(item));

  return { paths, progress };
}
