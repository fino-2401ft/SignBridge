import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Sign } from "../types/dictionary";
import { DEMO_SIGNS, parseSign } from "../types/dictionary";
import { isFirebaseConfigured } from "../utils/env";
import { getFirebase, requireFirebase } from "./firebase";

function mapSignDoc(id: string, data: Record<string, unknown>): Sign | null {
  try {
    return parseSign({
      id,
      title: data.title ?? "",
      category: data.category ?? "General",
      difficulty: data.difficulty ?? "Easy",
      emoji: data.emoji ?? "👋",
      videoUrl: data.videoUrl ?? data.videoURL ?? "",
      thumbnailUrl: data.thumbnailUrl ?? data.thumbnailURL ?? undefined,
      description: data.description ?? "",
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      createdAt: typeof data.createdAt === "number" ? data.createdAt : undefined,
    });
  } catch {
    return null;
  }
}

function filterDemoSigns(category?: string): Sign[] {
  if (!category || category === "All") {
    return [...DEMO_SIGNS];
  }
  return DEMO_SIGNS.filter(
    (s) => s.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Loads dictionary signs, optionally filtered by category.
 * Falls back seamlessly to offline DEMO_SIGNS when Firestore is not configured or collection is empty.
 */
export async function getSignsByCategory(category?: string): Promise<Sign[]> {
  if (!isFirebaseConfigured() || !getFirebase()) {
    return filterDemoSigns(category);
  }

  try {
    const { db } = requireFirebase();
    const col = collection(db, "dictionary");
    const q =
      category && category !== "All"
        ? query(col, where("category", "==", category), orderBy("title"))
        : query(col, orderBy("title"));

    const snap = await getDocs(q);
    const results: Sign[] = [];
    for (const d of snap.docs) {
      const mapped = mapSignDoc(d.id, d.data() as Record<string, unknown>);
      if (mapped) {
        results.push(mapped);
      }
    }

    if (results.length === 0) {
      return filterDemoSigns(category);
    }
    return results;
  } catch (err) {
    console.warn("[dictionaryService] Failed to fetch from Firestore, using demo signs:", err);
    return filterDemoSigns(category);
  }
}

/**
 * Searches signs by query across title, category, keywords, and description.
 */
export async function searchSigns(queryStr: string): Promise<Sign[]> {
  const trimmed = queryStr.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const allSigns = await getSignsByCategory();
  return allSigns.filter(
    (s) =>
      s.title.toLowerCase().includes(trimmed) ||
      s.category.toLowerCase().includes(trimmed) ||
      s.keywords.some((k) => k.toLowerCase().includes(trimmed)) ||
      s.description.toLowerCase().includes(trimmed),
  );
}

/**
 * Retrieves a single sign by id.
 */
export async function getSignById(id: string): Promise<Sign | null> {
  if (!isFirebaseConfigured() || !getFirebase()) {
    return DEMO_SIGNS.find((s) => s.id === id) ?? null;
  }

  try {
    const { db } = requireFirebase();
    const snap = await getDoc(doc(db, "dictionary", id));
    if (!snap.exists()) {
      return DEMO_SIGNS.find((s) => s.id === id) ?? null;
    }
    return mapSignDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.warn("[dictionaryService] getSignById error:", err);
    return DEMO_SIGNS.find((s) => s.id === id) ?? null;
  }
}

/**
 * Returns a deterministic set of daily signs seeded by current calendar date.
 */
export async function getDailySigns(count = 3): Promise<Sign[]> {
  const all = await getSignsByCategory();
  if (all.length === 0) {
    return [];
  }

  const today = new Date().toDateString();
  let seed = today.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...all].sort(() => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647 - 0.5;
  });

  return shuffled.slice(0, count);
}

/**
 * Returns all unique sorted categories.
 */
export async function getCategories(): Promise<string[]> {
  const signs = await getSignsByCategory();
  const set = new Set(signs.map((s) => s.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
