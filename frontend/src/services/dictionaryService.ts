import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { GestureCategory, GestureDTO } from "../types/gesture";
import {
  GestureSchema,
  normalizeCategory,
  parseGesture,
} from "../types/gesture";
import { isFirebaseConfigured } from "../utils/env";
import { getFirebase, requireFirebase } from "./firebase";

const DEMO_GESTURES: GestureDTO[] = [
  {
    gestureId: "g-hello",
    label: "Hello",
    alternatives: ["Hi", "Hey"],
    category: "greetings",
    videoUrl: "",
    description:
      "Raise your open hand to your forehead and bring it forward in a small arc.",
    difficulty: "beginner",
    tags: ["basic", "common", "daily"],
    isDynamic: true,
    pronunciation: "/həˈloʊ/",
  },
  {
    gestureId: "g-thank-you",
    label: "Thank You",
    alternatives: ["Thanks"],
    category: "greetings",
    videoUrl: "",
    description: "Fingertips touch the chin, then move forward toward the other person.",
    difficulty: "beginner",
    tags: ["basic", "polite"],
    isDynamic: true,
    pronunciation: "/θæŋk ju/",
  },
  {
    gestureId: "g-sorry",
    label: "Sorry",
    alternatives: ["Apologize"],
    category: "greetings",
    videoUrl: "",
    description: "Make a fist and rub it in a circle on your chest.",
    difficulty: "beginner",
    tags: ["polite"],
    isDynamic: true,
  },
  {
    gestureId: "g-please",
    label: "Please",
    alternatives: [],
    category: "greetings",
    videoUrl: "",
    description: "Open hand rubs in a circle on the chest.",
    difficulty: "beginner",
    tags: ["polite"],
    isDynamic: true,
  },
  {
    gestureId: "g-yes",
    label: "Yes",
    alternatives: [],
    category: "daily",
    videoUrl: "",
    description: "Fist nods up and down like a head saying yes.",
    difficulty: "beginner",
    tags: ["basic"],
    isDynamic: true,
  },
  {
    gestureId: "g-no",
    label: "No",
    alternatives: [],
    category: "daily",
    videoUrl: "",
    description: "Index and middle finger tap the thumb closed.",
    difficulty: "beginner",
    tags: ["basic"],
    isDynamic: true,
  },
  {
    gestureId: "g-help",
    label: "Help",
    alternatives: ["Assist"],
    category: "emergency",
    videoUrl: "",
    description: "Fist rests on an open palm; both hands rise together.",
    difficulty: "beginner",
    tags: ["emergency", "important"],
    isDynamic: true,
  },
  {
    gestureId: "g-a",
    label: "A",
    alternatives: [],
    category: "alphabet",
    videoUrl: "",
    description: "Closed fist with thumb resting along the side.",
    difficulty: "beginner",
    tags: ["alphabet"],
    isDynamic: false,
  },
  {
    gestureId: "g-b",
    label: "B",
    alternatives: [],
    category: "alphabet",
    videoUrl: "",
    description: "Flat hand, fingers together, thumb tucked across the palm.",
    difficulty: "beginner",
    tags: ["alphabet"],
    isDynamic: false,
  },
  {
    gestureId: "g-c",
    label: "C",
    alternatives: [],
    category: "alphabet",
    videoUrl: "",
    description: "Hand forms a C shape facing the side.",
    difficulty: "beginner",
    tags: ["alphabet"],
    isDynamic: false,
  },
  {
    gestureId: "g-1",
    label: "1",
    alternatives: ["One"],
    category: "numbers",
    videoUrl: "",
    description: "Index finger points up; other fingers closed.",
    difficulty: "beginner",
    tags: ["numbers"],
    isDynamic: false,
  },
  {
    gestureId: "g-2",
    label: "2",
    alternatives: ["Two"],
    category: "numbers",
    videoUrl: "",
    description: "Index and middle fingers form a V facing the viewer.",
    difficulty: "beginner",
    tags: ["numbers"],
    isDynamic: false,
  },
  {
    gestureId: "g-mother",
    label: "Mother",
    alternatives: ["Mom", "Mum"],
    category: "family",
    videoUrl: "",
    description: "Thumb of open hand taps the chin.",
    difficulty: "beginner",
    tags: ["family"],
    isDynamic: false,
  },
  {
    gestureId: "g-father",
    label: "Father",
    alternatives: ["Dad"],
    category: "family",
    videoUrl: "",
    description: "Thumb of open hand taps the forehead.",
    difficulty: "beginner",
    tags: ["family"],
    isDynamic: false,
  },
  {
    gestureId: "g-happy",
    label: "Happy",
    alternatives: ["Glad"],
    category: "emotions",
    videoUrl: "",
    description: "Open hands brush upward on the chest with a smile.",
    difficulty: "beginner",
    tags: ["emotion"],
    isDynamic: true,
  },
  {
    gestureId: "g-sad",
    label: "Sad",
    alternatives: [],
    category: "emotions",
    videoUrl: "",
    description: "Open hands slide down the face as expression softens.",
    difficulty: "beginner",
    tags: ["emotion"],
    isDynamic: true,
  },
  {
    gestureId: "g-what",
    label: "What",
    alternatives: [],
    category: "questions",
    videoUrl: "",
    description: "Both hands open, palms up, with a slight side-to-side shake.",
    difficulty: "beginner",
    tags: ["question"],
    isDynamic: true,
  },
  {
    gestureId: "g-where",
    label: "Where",
    alternatives: [],
    category: "questions",
    videoUrl: "",
    description: "Index finger points up and shakes side to side.",
    difficulty: "beginner",
    tags: ["question"],
    isDynamic: true,
  },
  {
    gestureId: "g-eat",
    label: "Eat",
    alternatives: ["Food"],
    category: "food",
    videoUrl: "",
    description: "Fingertips of a flattened O move toward the mouth repeatedly.",
    difficulty: "beginner",
    tags: ["food", "verb"],
    isDynamic: true,
  },
  {
    gestureId: "g-water",
    label: "Water",
    alternatives: [],
    category: "food",
    videoUrl: "",
    description: "Index, middle, and thumb form a W that taps the chin.",
    difficulty: "beginner",
    tags: ["food", "drink"],
    isDynamic: false,
  },
  {
    gestureId: "g-today",
    label: "Today",
    alternatives: [],
    category: "time",
    videoUrl: "",
    description: "Y-handshapes drop downward together.",
    difficulty: "intermediate",
    tags: ["time"],
    isDynamic: true,
  },
  {
    gestureId: "g-red",
    label: "Red",
    alternatives: [],
    category: "colors",
    videoUrl: "",
    description: "Index finger brushes down the lips.",
    difficulty: "beginner",
    tags: ["color"],
    isDynamic: false,
  },
  {
    gestureId: "g-work",
    label: "Work",
    alternatives: ["Job"],
    category: "verbs",
    videoUrl: "",
    description: "S-handshapes tap together at the wrists.",
    difficulty: "beginner",
    tags: ["verb"],
    isDynamic: true,
  },
];

function demoGestures(): GestureDTO[] {
  return DEMO_GESTURES.map((item) => parseGesture(item));
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  for (let i = 0; i < rows; i += 1) {
    const row = matrix[i];
    if (!row) continue;
    row[0] = i;
  }
  const firstRow = matrix[0];
  if (firstRow) {
    for (let j = 0; j < cols; j += 1) {
      firstRow[j] = j;
    }
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = matrix[i];
      const prevRow = matrix[i - 1];
      if (!row || !prevRow) continue;
      row[j] = Math.min(
        (prevRow[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (prevRow[j - 1] ?? 0) + cost,
      );
    }
  }

  return matrix[a.length]?.[b.length] ?? 0;
}

export function scoreGestureMatch(query: string, gesture: GestureDTO): number {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return 0;
  }

  const word = gesture.label.toLowerCase();
  if (word === normalizedQuery) {
    return 100;
  }
  if (word.startsWith(normalizedQuery)) {
    return 80;
  }
  if (word.includes(normalizedQuery)) {
    return 60;
  }
  if (
    gesture.alternatives.some((alt) =>
      alt.toLowerCase().includes(normalizedQuery),
    )
  ) {
    return 50;
  }
  if (levenshtein(normalizedQuery, word) <= 2) {
    return 30;
  }
  return 0;
}

export function searchGestures(gestures: GestureDTO[], query: string): GestureDTO[] {
  return gestures
    .map((gesture) => ({ gesture, score: scoreGestureMatch(query, gesture) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.gesture.label.localeCompare(b.gesture.label))
    .map((result) => result.gesture);
}

export function filterByCategory(
  gestures: GestureDTO[],
  category: GestureCategory,
): GestureDTO[] {
  const target = normalizeCategory(category);
  return gestures.filter(
    (gesture) => normalizeCategory(gesture.category) === target,
  );
}

export function countByCategory(
  gestures: GestureDTO[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const gesture of gestures) {
    const key = normalizeCategory(gesture.category);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function mapGestureDoc(id: string, data: Record<string, unknown>): GestureDTO | null {
  try {
    return GestureSchema.parse({
      gestureId: typeof data.gestureId === "string" ? data.gestureId : id,
      label: data.label ?? data.word,
      alternatives: data.alternatives ?? [],
      category: data.category,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl: data.thumbnailUrl,
      description: data.description ?? "",
      difficulty: data.difficulty ?? "beginner",
      tags: data.tags ?? [],
      isDynamic: data.isDynamic ?? false,
      pronunciation: data.pronunciation,
    });
  } catch {
    return null;
  }
}

async function fetchFromFirestore(): Promise<GestureDTO[]> {
  const { db } = requireFirebase();
  const snap = await getDocs(
    query(collection(db, "dictionary_gestures"), orderBy("label", "asc")),
  );
  const gestures: GestureDTO[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    if (data.isPublished === false) {
      continue;
    }
    const mapped = mapGestureDoc(docSnap.id, data);
    if (mapped) {
      gestures.push(mapped);
    }
  }
  return gestures;
}

async function fetchFromCallable(category?: GestureCategory): Promise<GestureDTO[]> {
  const { app } = requireFirebase();
  const functions = getFunctions(app);
  const callable = httpsCallable<
    { category?: string },
    { gestures: Array<Record<string, unknown>> }
  >(functions, "getDictionaryGestures");

  const result = await callable(category ? { category } : {});
  const gestures: GestureDTO[] = [];
  for (const raw of result.data.gestures ?? []) {
    const id =
      typeof raw.gestureId === "string"
        ? raw.gestureId
        : typeof raw.id === "string"
          ? raw.id
          : "";
    const mapped = mapGestureDoc(id, raw);
    if (mapped) {
      gestures.push(mapped);
    }
  }
  return gestures;
}

export async function fetchDictionaryGestures(): Promise<{
  gestures: GestureDTO[];
  source: "firestore" | "callable" | "demo";
}> {
  if (isFirebaseConfigured() && getFirebase()) {
    try {
      const gestures = await fetchFromFirestore();
      if (gestures.length > 0) {
        return { gestures, source: "firestore" };
      }
    } catch {
      // Try callable next.
    }

    try {
      const gestures = await fetchFromCallable();
      if (gestures.length > 0) {
        return { gestures, source: "callable" };
      }
    } catch {
      // Fall through to demo.
    }
  }
  return { gestures: demoGestures(), source: "demo" };
}

export async function addGestureToPracticeList(
  gestureId: string,
): Promise<{ alreadyAdded: boolean; source: "callable" | "local" }> {
  if (isFirebaseConfigured() && getFirebase()) {
    try {
      const { app } = requireFirebase();
      const functions = getFunctions(app);
      const callable = httpsCallable<
        { gestureId: string },
        { gestureId: string; alreadyAdded: boolean }
      >(functions, "addToPracticeList");
      const result = await callable({ gestureId });
      return { alreadyAdded: result.data.alreadyAdded, source: "callable" };
    } catch {
      // Local acknowledgment when offline / function unavailable.
    }
  }
  return { alreadyAdded: false, source: "local" };
}
