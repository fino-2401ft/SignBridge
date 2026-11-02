import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useCategories, useSignsList } from "../../hooks/useDictionary";
import type { Sign, SignDifficulty } from "../../types/dictionary";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";
import { DictionaryDetailModal } from "./DictionaryDetailModal";

interface DictionaryScreenProps {
  onBack?: () => void;
  onNavigateTab?: (tab: MainTab) => void;
}

function getDifficultyTone(difficulty: SignDifficulty): { bg: string; text: string } {
  switch (difficulty) {
    case "Easy":
      return { bg: colors.successSoft, text: colors.success };
    case "Medium":
      return { bg: colors.warningSoft, text: colors.warning };
    case "Hard":
      return { bg: colors.errorSoft, text: colors.error };
    default:
      return { bg: colors.primarySoft, text: colors.primary };
  }
}

export function DictionaryScreen({
  onBack,
  onNavigateTab,
}: DictionaryScreenProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSign, setActiveSign] = useState<Sign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { signs, loadState, errorMessage, reload } = useSignsList();
  const { categories } = useCategories();

  const allCategories = useMemo(() => {
    return ["All", ...categories.filter((c) => c !== "All")];
  }, [categories]);

  const filteredSigns = useMemo(() => {
    let result = signs;

    if (selectedCategory && selectedCategory !== "All") {
      result = result.filter(
        (s) => s.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(trimmed) ||
          s.category.toLowerCase().includes(trimmed) ||
          s.keywords.some((k) => k.toLowerCase().includes(trimmed)) ||
          s.description.toLowerCase().includes(trimmed),
      );
    }

    return result.sort((a, b) => a.title.localeCompare(b.title));
  }, [signs, selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openSignDetail = (sign: Sign): void => {
    setActiveSign(sign);
    setModalVisible(true);
  };

  const closeSignDetail = (): void => {
    setModalVisible(false);
    setActiveSign(null);
  };

  const renderSignCard = ({ item }: { item: Sign }): JSX.Element => {
    const diff = getDifficultyTone(item.difficulty);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View gesture for ${item.title}`}
        onPress={() => openSignDetail(item)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardEmojiWrap}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
          </View>
          <View style={[styles.cardDiffPill, { backgroundColor: diff.bg }]}>
            <Text style={[styles.cardDiffText, { color: diff.text }]}>{item.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardCategory} numberOfLines={1}>
          {item.category}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || "Tap to view sign demonstration."}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>ASL Dictionary</Text>
          <Text style={styles.subtitle}>
            Explore {signs.length} signs with video demos
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by sign, category, or keyword…"
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            onPress={() => setSearchQuery("")}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal Category Filter Pills */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {allCategories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
              >
                <Text
                  style={[styles.categoryText, active && styles.categoryTextActive]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Body: Loading / Error / Empty / Grid */}
      {loadState === "loading" && signs.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading dictionary catalog…</Text>
        </View>
      ) : loadState === "error" && signs.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load dictionary</Text>
          <Text style={styles.stateText}>
            {errorMessage ?? "Check your network and try again."}
          </Text>
          <View style={styles.retryBtnWrap}>
            <PrimaryButton label="Retry" onPress={() => void reload()} />
          </View>
        </View>
      ) : filteredSigns.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateEmoji}>🔍</Text>
          <Text style={styles.stateTitle}>No signs found</Text>
          <Text style={styles.stateText}>
            Try adjusting your search query or select another category filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSigns}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.rowWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={renderSignCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Main Tab Bar */}
      <MainTabBar
        activeTab="Dictionary"
        onChange={(tab) => {
          if (tab === "Learn" && onBack) {
            onBack();
          } else if (onNavigateTab) {
            onNavigateTab(tab);
          }
        }}
      />

      {/* Video Demonstration Modal */}
      <DictionaryDetailModal
        sign={activeSign}
        visible={modalVisible}
        onClose={closeSignDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  headerTitleWrap: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginHorizontal: 18,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: colors.text,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  clearBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  categoryBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 24,
  },
  rowWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  cardPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardDiffPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  cardDiffText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  cardCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  stateEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  stateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtnWrap: {
    marginTop: 12,
    width: 140,
  },
});
