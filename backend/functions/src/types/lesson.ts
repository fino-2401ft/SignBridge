/** Firestore lesson document for Path Detail / Lesson playback (FR-004 / FR-007). */

export interface LessonDocument {
  id: string;
  pathId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  xpReward: number;
  gestures: string[];
  order: number;
  isPublished: boolean;
}

export interface CompleteLessonResponse {
  lessonId: string;
  pathId: string;
  awardedXp: number;
  totalXp: number;
  currentLevel: number;
  progressPercent: number;
  completedLessonIds: string[];
  alreadyCompleted: boolean;
  pathBonusXp: number;
}
