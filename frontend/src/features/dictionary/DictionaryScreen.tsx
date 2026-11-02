import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureCard } from "../../components/dictionary/GestureCard";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { useDictionaryStore } from "../../stores/useDictionaryStore";
import type { GestureDTO } from "../../types/gesture";
import { DICTIONARY_CATEGORIES } from "../../types/gesture";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";

type DictionaryMode = "browse" | "search";

export function DictionaryScreen(): JSX.Element {
  const activeTab = useAppNavStore((s) => s.activeTab);
  const setTab = useAppNavStore((s) => s.setTab);
  const openGestureDetail = useAppNavStore((s) => s.openGestureDetail);

  const loadState = useDictionaryStore((s) => s.loadState);
  const errorMessage = useDictionaryStore((s) => s.errorMessage);
  const query = useDictionaryStore((s) => s.query);
  const selectedCategory = useDictionaryStore((s) => s.selectedCategory);
  const gestures = useDictionaryStore((s) => s.gestures);
  const loadGestures = useDictionaryStore((s) => s.loadGestures);
  const setQuery = useDictionaryStore((s) => s.setQuery);
  const setSelectedCategory = useDictionaryStore((s) => s.setSelectedCategory);
  const getVisibleGestures = useDictionaryStore((s) => s.getVisibleGestures);
  const getCategoryCounts = useDictionaryStore((s) => s.getCategoryCounts);

  const [mode, setMode] = useState<DictionaryMode>("browse");
  const [draftQuery, setDraftQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loadState === "idle") {
      void loadGestures();
    }
  }, [loadState, loadGestures]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const visible = useMemo(
    () => getVisibleGestures(),
    [getVisibleGestures, gestures, query, selectedCategory],
  );

  const counts = useMemo(
    () => getCategoryCounts(),
    [getCategoryCounts, gestures],
  );

  const onChangeQuery = (text: string): void => {
    setDraftQuery(text);
    setMode("search");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setQuery(text);
    }, 300);
  };

  const onSelectCategory = (categoryId: (typeof DICTIONARY_CATEGORIES)[number]["id"]): void => {
    setMode("browse");
    setDraftQuery("");
    setQuery("");
    setSelectedCategory(
      selectedCategory === categoryId ? null : categoryId,
    );
  };

  const onGesturePress = (gesture: GestureDTO): void => {
    openGestureDetail(gesture.gestureId);
  };

  const onTabChange = (tab: MainTab): void => {
    setTab(tab);
  };

  const selectedMeta = DICTIONARY_CATEGORIES.find(
    (item) => item.id === selectedCategory,
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Dictionary</Text>
        <Text style={styles.subtitle}>Search or browse ASL gestures</Text>

        <View style={styles.searchWrap}>
          <TextInput
            value={draftQuery}
            onChangeText={onChangeQuery}
            onFocus={() => setMode("search")}
            placeholder="Search gestures..."
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
            accessibilityLabel="Search gestures"
          />
          {draftQuery.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setDraftQuery("");
                setQuery("");
                setMode("browse");
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("browse")}
            style={[styles.modeChip, mode === "browse" && styles.modeChipActive]}
          >
            <Text style={[styles.modeText, mode === "browse" && styles.modeTextActive]}>
              Categories
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("search")}
            style={[styles.modeChip, mode === "search" && styles.modeChipActive]}
          >
            <Text style={[styles.modeText, mode === "search" && styles.modeTextActive]}>
              Results
            </Text>
          </Pressable>
        </View>

        {loadState === "loading" || loadState === "idle" ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading dictionary…</Text>
          </View>
        ) : null}

        {loadState === "error" ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Search failed</Text>
            <Text style={styles.stateText}>{errorMessage ?? "Please try again."}</Text>
            <View style={styles.retryWrap}>
              <PrimaryButton label="Retry" onPress={() => void loadGestures()} />
            </View>
          </View>
        ) : null}

        {loadState === "ready" && mode === "browse" && !selectedCategory ? (
          <View style={styles.grid}>
            {DICTIONARY_CATEGORIES.map((category) => {
              const count = counts[category.id] ?? 0;
              if (count === 0) {
                return null;
              }
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => onSelectCategory(category.id)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    pressed && styles.categoryPressed,
                  ]}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {loadState === "ready" && (mode === "search" || selectedCategory) ? (
          <View>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>
                {selectedMeta
                  ? `${selectedMeta.icon} ${selectedMeta.name}`
                  : query.trim()
                    ? `Results for “${query.trim()}”`
                    : "All gestures"}
              </Text>
              {selectedCategory ? (
                <Pressable onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.link}>All categories</Text>
                </Pressable>
              ) : null}
            </View>

            {visible.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>
                  {query.trim()
                    ? `No results for “${query.trim()}”`
                    : "No gestures in this category"}
                </Text>
                <Text style={styles.stateText}>
                  Check spelling, try another word, or browse by category.
                </Text>
              </View>
            ) : (
              visible.map((gesture) => (
                <View key={gesture.gestureId} style={styles.cardWrap}>
                  <GestureCard gesture={gesture} onPress={onGesturePress} />
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <MainTabBar activeTab={activeTab} onChange={onTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: touchMin,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  clearBtn: {
    minHeight: touchMin,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearText: {
    fontWeight: "700",
    color: colors.primary,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "31%",
    flexGrow: 1,
    minWidth: "30%",
    maxWidth: "48%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  categoryPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.97 }],
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  link: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  cardWrap: {
    marginBottom: 10,
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryWrap: {
    marginTop: 8,
    width: "100%",
    maxWidth: 220,
  },
});
