/** Firestore document shapes for Home / Learning Path (FR-006, FR-008). */

export type UnlockCondition =
  | { type: "none" }
  | { type: "path_complete"; requiredPathId: string }
  | { type: "xp_threshold"; requiredXp: number };

export interface LearningPathDocument {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
  estimatedMinutes: number;
  order: number;
  icon: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  isPublished: boolean;
  unlockCondition: UnlockCondition;
}

export interface PathProgressDocument {
  pathId: string;
  userId: string;
  completedLessonIds: string[];
  progressPercent: number;
}

export interface LearningCatalogResponse {
  paths: LearningPathDocument[];
  progress: Array<{
    pathId: string;
    completedLessonIds: string[];
    progressPercent: number;
  }>;
}
