import * as admin from "firebase-admin";
import type {
  DictionaryCategory,
  DictionaryDifficulty,
  DictionaryGestureDocument,
} from "../types/dictionary";

const COLLECTION = "dictionary_gestures";

const VALID_CATEGORIES = new Set<DictionaryCategory>([
  "greetings",
  "alphabet",
  "numbers",
  "family",
  "emotions",
  "verbs",
  "nouns",
  "time",
  "food",
  "colors",
  "questions",
  "emergency",
  "daily",
]);

function asCategory(raw: unknown): DictionaryCategory {
  if (typeof raw === "string" && VALID_CATEGORIES.has(raw as DictionaryCategory)) {
    return raw as DictionaryCategory;
  }
  // Legacy aliases from older seeds
  if (raw === "greeting") return "greetings";
  if (raw === "number") return "numbers";
  if (raw === "emotion") return "emotions";
  if (raw === "verb") return "verbs";
  if (raw === "basics") return "daily";
  return "daily";
}

function asDifficulty(raw: unknown): DictionaryDifficulty {
  if (raw === "intermediate" || raw === "advanced") {
    return raw;
  }
  return "beginner";
}

function asGesture(
  id: string,
  data: Record<string, unknown>,
): DictionaryGestureDocument | null {
  const label =
    typeof data.label === "string"
      ? data.label
      : typeof data.word === "string"
        ? data.word
        : "";
  if (!label) {
    return null;
  }

  const alternatives = Array.isArray(data.alternatives)
    ? data.alternatives.filter((item): item is string => typeof item === "string")
    : [];
  const tags = Array.isArray(data.tags)
    ? data.tags.filter((item): item is string => typeof item === "string")
    : [];

  return {
    gestureId: typeof data.gestureId === "string" ? data.gestureId : id,
    label,
    alternatives,
    category: asCategory(data.category),
    videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
    thumbnailUrl:
      typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : undefined,
    description: typeof data.description === "string" ? data.description : "",
    difficulty: asDifficulty(data.difficulty),
    tags,
    isDynamic: data.isDynamic === true,
    pronunciation:
      typeof data.pronunciation === "string" ? data.pronunciation : undefined,
    isPublished: data.isPublished !== false,
  };
}

export async function fetchPublishedGestures(
  db: admin.firestore.Firestore,
  category?: string,
): Promise<DictionaryGestureDocument[]> {
  let query: admin.firestore.Query = db
    .collection(COLLECTION)
    .where("isPublished", "==", true);

  if (category && VALID_CATEGORIES.has(category as DictionaryCategory)) {
    query = query.where("category", "==", category);
  }

  query = query.orderBy("label", "asc");
  const snap = await query.get();

  const gestures: DictionaryGestureDocument[] = [];
  for (const doc of snap.docs) {
    const parsed = asGesture(doc.id, doc.data() as Record<string, unknown>);
    if (parsed) {
      gestures.push(parsed);
    }
  }
  return gestures;
}

export async function fetchGestureById(
  db: admin.firestore.Firestore,
  gestureId: string,
): Promise<DictionaryGestureDocument | null> {
  const snap = await db.collection(COLLECTION).doc(gestureId).get();
  if (!snap.exists) {
    return null;
  }
  const parsed = asGesture(snap.id, snap.data() as Record<string, unknown>);
  if (!parsed || !parsed.isPublished) {
    return null;
  }
  return parsed;
}

export async function addGestureToPracticeQueue(
  db: admin.firestore.Firestore,
  params: { userId: string; gestureId: string },
): Promise<{ gestureId: string; alreadyAdded: boolean }> {
  const gesture = await fetchGestureById(db, params.gestureId);
  if (!gesture) {
    throw new Error("GESTURE_NOT_FOUND");
  }

  const ref = db
    .collection("users")
    .doc(params.userId)
    .collection("practice_queue")
    .doc(gesture.gestureId);

  const existing = await ref.get();
  if (existing.exists) {
    return { gestureId: gesture.gestureId, alreadyAdded: true };
  }

  await ref.set({
    gestureId: gesture.gestureId,
    userId: params.userId,
    label: gesture.label,
    category: gesture.category,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { gestureId: gesture.gestureId, alreadyAdded: false };
}
