import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCategories,
  getDailySigns,
  getSignsByCategory,
  searchSigns,
} from "../services/dictionaryService";
import type { DictionaryLoadState, Sign } from "../types/dictionary";

export interface UseSignsListReturn {
  signs: Sign[];
  loadState: DictionaryLoadState;
  errorMessage: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads sign list for an optional category.
 * Handles timeouts and error states cleanly.
 */
export function useSignsList(category?: string): UseSignsListReturn {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loadState, setLoadState] = useState<DictionaryLoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);
    try {
      const data = await getSignsByCategory(category);
      setSigns(data);
      setLoadState(data.length === 0 ? "empty" : "ready");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not load dictionary data. Check your connection.",
      );
      setLoadState("error");
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  return { signs, loadState, errorMessage, reload: load };
}

export interface UseSignSearchReturn {
  query: string;
  setQuery: (val: string) => void;
  results: Sign[];
  isSearching: boolean;
}

/**
 * Debounced search across dictionary signs.
 */
export function useSignSearch(initialSigns?: Sign[]): UseSignSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Sign[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        if (initialSigns && initialSigns.length > 0) {
          const lower = trimmed.toLowerCase();
          const filtered = initialSigns.filter(
            (s) =>
              s.title.toLowerCase().includes(lower) ||
              s.category.toLowerCase().includes(lower) ||
              s.keywords.some((k) => k.toLowerCase().includes(lower)) ||
              s.description.toLowerCase().includes(lower),
          );
          setResults(filtered);
        } else {
          const res = await searchSigns(trimmed);
          setResults(res);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, initialSigns]);

  return { query, setQuery, results, isSearching };
}

export interface UseCategoriesReturn {
  categories: string[];
  loading: boolean;
}

/**
 * Retrieves list of available sign categories.
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCategories()
      .then((cats) => {
        if (mounted) {
          setCategories(cats);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading };
}

/**
 * Loads daily featured signs.
 */
export function useDailySigns(count = 3): { signs: Sign[]; loading: boolean } {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDailySigns(count)
      .then((data) => {
        if (mounted) {
          setSigns(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [count]);

  return { signs, loading };
}
