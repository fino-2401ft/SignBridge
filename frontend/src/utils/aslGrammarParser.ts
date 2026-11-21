import type { Sign } from "../types/dictionary";
import type { GestureDTO } from "../types/gesture";

// Simple lemmatization dictionary for base forms
const LEMMA_MAP: Record<string, string> = {
  going: "go",
  went: "go",
  goes: "go",
  loving: "love",
  loved: "love",
  loves: "love",
  likes: "like",
  liked: "like",
  liking: "like",
  wants: "want",
  wanted: "want",
  wanting: "want",
  needs: "need",
  needed: "need",
  drinking: "drink",
  drank: "drink",
  eating: "eat",
  ate: "eat",
  sleeping: "sleep",
  slept: "sleep",
  working: "work",
  worked: "work",
  friends: "friend",
  schools: "school",
  homes: "home",
  "thank-you": "thankyou",
  thank: "thankyou",
  "good-bye": "goodbye",
  bye: "goodbye",
};

// ASL Stopwords - auxiliary words that are omitted in ASL grammar
const STOPWORDS = new Set([
  "am", "is", "are", "was", "were", "be", "been", "being",
  "a", "an", "the",
  "to", "of", "at", "by", "for", "with", "about", "against", "during", "before", "after",
  "and", "but", "or", "so",
  "do", "does", "did", "done",
  "will", "would", "shall", "should",
  "have", "has", "had", "having",
]);

// Contractions map
const CONTRACTIONS: Record<string, string[]> = {
  "don't": ["not"],
  "doesn't": ["not"],
  "didn't": ["not"],
  "won't": ["not"],
  "can't": ["not"],
  "isn't": ["not"],
  "aren't": ["not"],
  "wasn't": ["not"],
  "weren't": ["not"],
  "i'm": ["i"],
  "you're": ["you"],
  "he's": ["he"],
  "she's": ["she"],
  "it's": ["it"],
  "we're": ["we"],
  "they're": ["they"],
  "i've": ["i"],
  "you've": ["you"],
  "we've": ["we"],
  "they've": ["they"],
  "i'd": ["i"],
  "you'd": ["you"],
  "he'd": ["he"],
  "she'd": ["she"],
  "we'd": ["we"],
  "they'd": ["they"],
  "i'll": ["i"],
  "you'll": ["you"],
  "he'll": ["he"],
  "she'll": ["she"],
  "we'll": ["we"],
  "they'll": ["they"],
};

// WH-Question words moved to the end in ASL question structure
const WH_WORDS = new Set(["what", "who", "where", "why", "how", "when", "which"]);

export interface ParsedASLResult {
  parsedGloss: string[];
  matchedWords: string[];
}

/**
 * Translates a natural English sentence into ASL Gloss ordering.
 * 1. Clean punctuation & lowercase.
 * 2. Expand contractions (don't -> not).
 * 3. Normalize compound signs (thank you -> thankyou).
 * 4. Drop stopwords (be-verbs, prepositions, articles).
 * 5. Lemmatize words to root form.
 * 6. Move WH-words to the sentence ending.
 */
export function parseSentenceToASLGloss(sentence: string): ParsedASLResult {
  if (!sentence || !sentence.trim()) {
    return { parsedGloss: [], matchedWords: [] };
  }

  const cleanText = sentence
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedText = cleanText
    .replace(/\bthank\s+you\b/g, "thankyou")
    .replace(/\bgood\s+bye\b/g, "goodbye");

  const rawTokens = normalizedText.split(/\s+/);
  const expandedTokens: string[] = [];

  for (const token of rawTokens) {
    if (CONTRACTIONS[token]) {
      expandedTokens.push(...CONTRACTIONS[token]);
    } else {
      expandedTokens.push(token);
    }
  }

  const processedGloss: string[] = [];

  for (const token of expandedTokens) {
    if (STOPWORDS.has(token)) {
      continue;
    }
    const baseForm = LEMMA_MAP[token] || token;
    processedGloss.push(baseForm);
  }

  const mainGloss: string[] = [];
  const whGloss: string[] = [];

  for (const word of processedGloss) {
    if (WH_WORDS.has(word)) {
      whGloss.push(word);
    } else {
      mainGloss.push(word);
    }
  }

  const finalGloss = [...mainGloss, ...whGloss];

  return {
    parsedGloss: finalGloss,
    matchedWords: finalGloss,
  };
}

/**
 * Matches ASL Gloss tokens against dictionary signs or gesture items.
 */
export function matchGlossToSigns(
  gloss: string[],
  availableSigns: Sign[],
): Sign[] {
  const matched: Sign[] = [];
  for (const word of gloss) {
    const found = availableSigns.find(
      (s) =>
        s.title.toLowerCase() === word ||
        s.title.toLowerCase().replace(/\s+/g, "") === word ||
        s.keywords.some((k) => k.toLowerCase() === word),
    );
    if (found) {
      matched.push(found);
    }
  }
  return matched;
}

/**
 * Matches ASL Gloss tokens against GestureDTO list.
 */
export function matchGlossToGestures(
  gloss: string[],
  availableGestures: GestureDTO[],
): GestureDTO[] {
  const matched: GestureDTO[] = [];
  for (const word of gloss) {
    const found = availableGestures.find(
      (g) =>
        g.label.toLowerCase() === word ||
        g.label.toLowerCase().replace(/\s+/g, "") === word ||
        g.alternatives.some((alt) => alt.toLowerCase() === word) ||
        g.tags.some((tag) => tag.toLowerCase() === word),
    );
    if (found) {
      matched.push(found);
    }
  }
  return matched;
}
