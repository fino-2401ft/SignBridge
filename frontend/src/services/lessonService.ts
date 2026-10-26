import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { Lesson } from "../types/lesson";
import { LessonSchema } from "../types/lesson";
import { isFirebaseConfigured } from "../utils/env";
import { getFirebase, requireFirebase } from "./firebase";

/** Demo curriculum for path-basics (project-context §5.2). */
const BASICS_LESSONS: Lesson[] = [
  {
    id: "lesson-basics-01",
    pathId: "path-basics",
    title: "Introduction to Fingerspelling",
    description:
      "Learn how fingerspelling works in ASL and how to position your dominant hand clearly in frame.",
    videoUrl: "",
    durationSeconds: 120,
    xpReward: 10,
    gestures: ["Fingerspell"],
    order: 1,
  },
  {
    id: "lesson-basics-02",
    pathId: "path-basics",
    title: "Letters A–E",
    description: "Practice the first five letters of the ASL alphabet: A, B, C, D, and E.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["A", "B", "C", "D", "E"],
    order: 2,
  },
  {
    id: "lesson-basics-03",
    pathId: "path-basics",
    title: "Letters F–J",
    description: "Continue the alphabet with F through J, including the dynamic letter J.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["F", "G", "H", "I", "J"],
    order: 3,
  },
  {
    id: "lesson-basics-04",
    pathId: "path-basics",
    title: "Letters K–O",
    description: "Form K, L, M, N, and O with clear finger spacing and a steady wrist.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["K", "L", "M", "N", "O"],
    order: 4,
  },
  {
    id: "lesson-basics-05",
    pathId: "path-basics",
    title: "Letters P–T",
    description: "Practice P through T. Watch palm orientation for P and Q carefully.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["P", "Q", "R", "S", "T"],
    order: 5,
  },
  {
    id: "lesson-basics-06",
    pathId: "path-basics",
    title: "Letters U–Z",
    description: "Finish the alphabet with U–Z, including the dynamic letter Z.",
    videoUrl: "",
    durationSeconds: 200,
    xpReward: 10,
    gestures: ["U", "V", "W", "X", "Y", "Z"],
    order: 6,
  },
  {
    id: "lesson-basics-07",
    pathId: "path-basics",
    title: "Numbers 1–10",
    description: "Count from 1 to 10 in ASL. Keep numbers facing the viewer.",
    videoUrl: "",
    durationSeconds: 160,
    xpReward: 10,
    gestures: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    order: 7,
  },
  {
    id: "lesson-basics-08",
    pathId: "path-basics",
    title: "Basic Words",
    description: "Combine letters into everyday signs: Hello, Yes, No, and Thank You.",
    videoUrl: "",
    durationSeconds: 210,
    xpReward: 15,
    gestures: ["Hello", "Yes", "No", "Thank You"],
    order: 8,
  },
];

const EVERYDAY_LESSONS: Lesson[] = [
  {
    id: "lesson-everyday-01",
    pathId: "path-everyday",
    title: "Greetings",
    description: "Learn Hello, Good morning, Good night, and polite openers.",
    videoUrl: "",
    durationSeconds: 150,
    xpReward: 10,
    gestures: ["Hello", "Good morning", "Good night"],
    order: 1,
  },
  {
    id: "lesson-everyday-02",
    pathId: "path-everyday",
    title: "Family",
    description: "Signs for mother, father, sister, brother, and family.",
    videoUrl: "",
    durationSeconds: 170,
    xpReward: 10,
    gestures: ["Mother", "Father", "Sister", "Brother", "Family"],
    order: 2,
  },
  {
    id: "lesson-everyday-03",
    pathId: "path-everyday",
    title: "Emotions",
    description: "Express happy, sad, angry, and excited with facial grammar.",
    videoUrl: "",
    durationSeconds: 160,
    xpReward: 10,
    gestures: ["Happy", "Sad", "Angry", "Excited"],
    order: 3,
  },
  {
    id: "lesson-everyday-04",
    pathId: "path-everyday",
    title: "Common Questions",
    description: "Ask What, Where, When, Who, and How in ASL.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["What", "Where", "When", "Who", "How"],
    order: 4,
  },
  {
    id: "lesson-everyday-05",
    pathId: "path-everyday",
    title: "Daily Activities",
    description: "Talk about eat, drink, sleep, work, and study.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 10,
    gestures: ["Eat", "Drink", "Sleep", "Work", "Study"],
    order: 5,
  },
  {
    id: "lesson-everyday-06",
    pathId: "path-everyday",
    title: "Food and Drinks",
    description: "Order water, coffee, bread, and fruit with clear mouthing.",
    videoUrl: "",
    durationSeconds: 170,
    xpReward: 10,
    gestures: ["Water", "Coffee", "Bread", "Fruit"],
    order: 6,
  },
  {
    id: "lesson-everyday-07",
    pathId: "path-everyday",
    title: "Time and Dates",
    description: "Express today, tomorrow, yesterday, and clock time basics.",
    videoUrl: "",
    durationSeconds: 190,
    xpReward: 10,
    gestures: ["Today", "Tomorrow", "Yesterday"],
    order: 7,
  },
  {
    id: "lesson-everyday-08",
    pathId: "path-everyday",
    title: "Places",
    description: "Sign home, school, store, hospital, and work.",
    videoUrl: "",
    durationSeconds: 180,
    xpReward: 15,
    gestures: ["Home", "School", "Store", "Hospital"],
    order: 8,
  },
];

const DEMO_BY_PATH: Record<string, Lesson[]> = {
  "path-basics": BASICS_LESSONS,
  "path-everyday": EVERYDAY_LESSONS,
};

function demoLessonsForPath(pathId: string): Lesson[] {
  const list = DEMO_BY_PATH[pathId] ?? [];
  return list.map((item) => LessonSchema.parse(item)).sort((a, b) => a.order - b.order);
}

function mapLessonDoc(id: string, data: Record<string, unknown>): Lesson | null {
  try {
    return LessonSchema.parse({
      id,
      pathId: data.pathId,
      title: data.title,
      description: data.description,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl: data.thumbnailUrl,
      durationSeconds: data.durationSeconds ?? data.duration ?? 120,
      xpReward: data.xpReward ?? 10,
      gestures: data.gestures ?? ["ASL"],
      order: data.order,
    });
  } catch {
    return null;
  }
}

async function fetchLessonsFromFirestore(pathId: string): Promise<Lesson[]> {
  const { db } = requireFirebase();
  const lessonsQuery = query(
    collection(db, "lessons"),
    where("pathId", "==", pathId),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(lessonsQuery);
  const lessons: Lesson[] = [];
  for (const lessonDoc of snap.docs) {
    const mapped = mapLessonDoc(lessonDoc.id, lessonDoc.data() as Record<string, unknown>);
    if (mapped) {
      lessons.push(mapped);
    }
  }
  return lessons;
}

async function fetchLessonsFromCallable(pathId: string): Promise<Lesson[]> {
  const { app } = requireFirebase();
  const functions = getFunctions(app);
  const callable = httpsCallable<{ pathId: string }, { lessons: Array<Record<string, unknown>> }>(
    functions,
    "getLessonsForPath",
  );
  const result = await callable({ pathId });
  const lessons: Lesson[] = [];
  for (const raw of result.data.lessons ?? []) {
    const id = typeof raw.id === "string" ? raw.id : "";
    const mapped = mapLessonDoc(id, raw);
    if (mapped) {
      lessons.push(mapped);
    }
  }
  return lessons.sort((a, b) => a.order - b.order);
}

export async function fetchLessonsForPath(pathId: string): Promise<{
  lessons: Lesson[];
  source: "firestore" | "callable" | "demo";
}> {
  if (isFirebaseConfigured() && getFirebase()) {
    try {
      const lessons = await fetchLessonsFromFirestore(pathId);
      if (lessons.length > 0) {
        return { lessons, source: "firestore" };
      }
    } catch {
      // Try callable next.
    }

    try {
      const lessons = await fetchLessonsFromCallable(pathId);
      if (lessons.length > 0) {
        return { lessons, source: "callable" };
      }
    } catch {
      // Fall through to demo.
    }
  }

  return { lessons: demoLessonsForPath(pathId), source: "demo" };
}

export interface CompleteLessonResult {
  awardedXp: number;
  progressPercent: number;
  completedLessonIds: string[];
  xpPendingSync: boolean;
  totalXp?: number;
  currentLevel?: number;
  pathBonusXp?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface CompleteLessonCallableResponse {
  awardedXp: number;
  progressPercent: number;
  completedLessonIds: string[];
  totalXp: number;
  currentLevel: number;
  pathBonusXp: number;
  alreadyCompleted: boolean;
}

/**
 * Marks a lesson complete, updates path progress, awards XP.
 * Prefers Cloud Function `completeLesson`, falls back to local + syncPathProgress.
 */
export async function completeLesson(params: {
  userId: string;
  pathId: string;
  lessonId: string;
  lessonCount: number;
  completedLessonIds: string[];
  xpReward: number;
}): Promise<CompleteLessonResult> {
  if (isFirebaseConfigured() && getFirebase()) {
    try {
      const { app } = requireFirebase();
      const functions = getFunctions(app);
      const callable = httpsCallable<{ lessonId: string }, CompleteLessonCallableResponse>(
        functions,
        "completeLesson",
      );
      const result = await callable({ lessonId: params.lessonId });
      return {
        awardedXp: result.data.awardedXp,
        progressPercent: result.data.progressPercent,
        completedLessonIds: result.data.completedLessonIds,
        xpPendingSync: false,
        totalXp: result.data.totalXp,
        currentLevel: result.data.currentLevel,
        pathBonusXp: result.data.pathBonusXp,
      };
    } catch {
      // Retry once via completeLesson, then local fallback.
      await delay(1000);
      try {
        const { app } = requireFirebase();
        const functions = getFunctions(app);
        const callable = httpsCallable<{ lessonId: string }, CompleteLessonCallableResponse>(
          functions,
          "completeLesson",
        );
        const result = await callable({ lessonId: params.lessonId });
        return {
          awardedXp: result.data.awardedXp,
          progressPercent: result.data.progressPercent,
          completedLessonIds: result.data.completedLessonIds,
          xpPendingSync: false,
          totalXp: result.data.totalXp,
          currentLevel: result.data.currentLevel,
          pathBonusXp: result.data.pathBonusXp,
        };
      } catch {
        // Continue to offline/local fallback.
      }
    }
  }

  const completedLessonIds = Array.from(
    new Set([...params.completedLessonIds, params.lessonId]),
  );
  const progressPercent =
    params.lessonCount > 0
      ? Math.round((completedLessonIds.length / params.lessonCount) * 100)
      : 0;

  let xpPendingSync = false;

  const syncOnce = async (): Promise<void> => {
    if (!isFirebaseConfigured() || !getFirebase()) {
      return;
    }
    const { app } = requireFirebase();
    const functions = getFunctions(app);
    const sync = httpsCallable(functions, "syncPathProgress");
    await sync({
      pathId: params.pathId,
      completedLessonIds,
      lessonCount: params.lessonCount,
    });
  };

  try {
    await syncOnce();
  } catch {
    await delay(1000);
    try {
      await syncOnce();
    } catch {
      xpPendingSync = true;
    }
  }

  return {
    awardedXp: params.xpReward,
    progressPercent: Math.min(100, progressPercent),
    completedLessonIds,
    xpPendingSync,
  };
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
