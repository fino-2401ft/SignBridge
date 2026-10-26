/**
 * Seed curriculum, lessons & dictionary for SignBridge (Home + Lesson).
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts
 *   npx tsx scripts/seed-demo-data.ts --write
 *   npx tsx scripts/seed-demo-data.ts --write --uid=<FIREBASE_UID>
 */

interface UnlockCondition {
  type: "none" | "path_complete" | "xp_threshold";
  requiredPathId?: string;
  requiredXp?: number;
}

interface SeedLearningPath {
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

interface SeedLesson {
  id: string;
  pathId: string;
  title: string;
  description: string;
  videoUrl: string;
  durationSeconds: number;
  xpReward: number;
  gestures: string[];
  order: number;
  isPublished: boolean;
}

interface SeedGesture {
  id: string;
  label: string;
  category: string;
  description: string;
  isDynamic: boolean;
}

interface SeedPathProgress {
  pathId: string;
  completedLessonIds: string[];
  progressPercent: number;
}

const LEARNING_PATHS: SeedLearningPath[] = [
  {
    id: "path-basics",
    title: "ASL Basics",
    description: "Fingerspelling, letters A–Z, numbers, and core everyday words.",
    lessonCount: 8,
    estimatedMinutes: 60,
    order: 1,
    icon: "👋",
    difficultyLevel: "beginner",
    isPublished: true,
    unlockCondition: { type: "none" },
  },
  {
    id: "path-everyday",
    title: "Everyday Communication",
    description: "Greetings, family, emotions, questions, and daily activities.",
    lessonCount: 8,
    estimatedMinutes: 70,
    order: 2,
    icon: "💬",
    difficultyLevel: "beginner",
    isPublished: true,
    unlockCondition: {
      type: "path_complete",
      requiredPathId: "path-basics",
    },
  },
  {
    id: "path-advanced",
    title: "Advanced Conversations",
    description: "Work, school, health, shopping, travel, and storytelling.",
    lessonCount: 8,
    estimatedMinutes: 80,
    order: 3,
    icon: "🗣️",
    difficultyLevel: "intermediate",
    isPublished: true,
    unlockCondition: {
      type: "path_complete",
      requiredPathId: "path-everyday",
    },
  },
  {
    id: "path-emergency",
    title: "Emergency Phrases",
    description: "High-priority signs for help, safety, and urgent situations.",
    lessonCount: 4,
    estimatedMinutes: 25,
    order: 4,
    icon: "🆘",
    difficultyLevel: "intermediate",
    isPublished: true,
    unlockCondition: {
      type: "xp_threshold",
      requiredXp: 1500,
    },
  },
];

const LESSONS: SeedLesson[] = [
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
  },
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
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
    isPublished: true,
  },
];

const DEMO_PATH_PROGRESS: SeedPathProgress[] = [
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

const GESTURES: SeedGesture[] = [
  {
    id: "g-hello",
    label: "Hello",
    category: "greeting",
    description: "Wave from the temple with an open palm.",
    isDynamic: true,
  },
  {
    id: "g-thank-you",
    label: "Thank You",
    category: "greeting",
    description: "Fingertips touch chin, then move forward.",
    isDynamic: true,
  },
  {
    id: "g-yes",
    label: "Yes",
    category: "basics",
    description: "Fist nods like a head saying yes.",
    isDynamic: true,
  },
  {
    id: "g-no",
    label: "No",
    category: "basics",
    description: "Index and middle finger tap the thumb closed.",
    isDynamic: true,
  },
];

function printDryRun(): void {
  console.log("=== SignBridge seed (dry-run) ===");
  console.log("learning_paths:", LEARNING_PATHS.length);
  console.log("lessons:", LESSONS.length);
  console.log("demo_path_progress:", JSON.stringify(DEMO_PATH_PROGRESS, null, 2));
  console.log("dictionary_gestures:", GESTURES.length);
  console.log("\nPass --write with Admin credentials to persist to Firestore.");
  console.log("Optional: --uid=<FIREBASE_UID> to also seed users/{uid}/path_progress.");
}

function readUidFlag(): string | null {
  const arg = process.argv.find((item) => item.startsWith("--uid="));
  if (!arg) {
    return null;
  }
  const value = arg.slice("--uid=".length).trim();
  return value.length > 0 ? value : null;
}

async function writeSeed(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin") as typeof import("firebase-admin");

  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const path of LEARNING_PATHS) {
    batch.set(db.collection("learning_paths").doc(path.id), {
      ...path,
      updatedAt: now,
    });
  }

  for (const lesson of LESSONS) {
    batch.set(db.collection("lessons").doc(lesson.id), {
      ...lesson,
      updatedAt: now,
    });
  }

  for (const gesture of GESTURES) {
    batch.set(db.collection("dictionary_gestures").doc(gesture.id), {
      gestureId: gesture.id,
      label: gesture.label,
      category: gesture.category,
      description: gesture.description,
      isDynamic: gesture.isDynamic,
      videoUrl: `gs://YOUR_BUCKET/videos/${gesture.id}.mp4`,
      thumbnailUrl: `gs://YOUR_BUCKET/thumbnails/${gesture.id}.jpg`,
      updatedAt: now,
    });
  }

  const uid = readUidFlag();
  if (uid) {
    for (const progress of DEMO_PATH_PROGRESS) {
      batch.set(
        db.collection("users").doc(uid).collection("path_progress").doc(progress.pathId),
        {
          pathId: progress.pathId,
          userId: uid,
          completedLessonIds: progress.completedLessonIds,
          progressPercent: progress.progressPercent,
          updatedAt: now,
        },
      );
    }
  }

  await batch.commit();
  console.log("Seed write complete.");
  console.log(`Seeded ${LESSONS.length} lessons.`);
  if (uid) {
    console.log(`Seeded path_progress for users/${uid}`);
  } else {
    console.log("Skipped path_progress (pass --uid=<FIREBASE_UID> to include).");
  }
}

async function main(): Promise<void> {
  const shouldWrite = process.argv.includes("--write");
  if (!shouldWrite) {
    printDryRun();
    return;
  }
  await writeSeed();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
