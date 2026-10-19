/**
 * Dry-run-safe seed script for demo curriculum & dictionary entries.
 *
 * Usage:
 *   npx ts-node scripts/seed-demo-data.ts           # prints payload only
 *   npx ts-node scripts/seed-demo-data.ts --write   # writes when GOOGLE_APPLICATION_CREDENTIALS is set
 */

interface SeedLearningPath {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  unlockType: "none" | "path_complete" | "xp_threshold";
}

interface SeedGesture {
  id: string;
  label: string;
  category: string;
  description: string;
  isDynamic: boolean;
}

const LEARNING_PATHS: SeedLearningPath[] = [
  {
    id: "path-basics",
    title: "ASL Basics",
    order: 1,
    lessonCount: 8,
    unlockType: "none",
  },
  {
    id: "path-everyday",
    title: "Everyday Communication",
    order: 2,
    lessonCount: 8,
    unlockType: "path_complete",
  },
  {
    id: "path-advanced",
    title: "Advanced Conversations",
    order: 3,
    lessonCount: 8,
    unlockType: "path_complete",
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
  console.log("learning_paths:", JSON.stringify(LEARNING_PATHS, null, 2));
  console.log("dictionary_gestures:", JSON.stringify(GESTURES, null, 2));
  console.log("\nPass --write with Admin credentials to persist to Firestore.");
}

async function writeSeed(): Promise<void> {
  // Lazy require so dry-run works without firebase-admin installed at repo root.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin") as typeof import("firebase-admin");

  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const batch = db.batch();

  for (const path of LEARNING_PATHS) {
    batch.set(db.collection("learning_paths").doc(path.id), {
      ...path,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log("Seed write complete.");
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
