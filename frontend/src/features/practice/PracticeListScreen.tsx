import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { fetchDictionaryGestures } from "../../services/dictionaryService";
import { useAppNavStore } from "../../stores/useAppNavStore";
import type { GestureDTO } from "../../types/gesture";
import { categoryDisplayName } from "../../types/gesture";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";

export function PracticeListScreen(): JSX.Element {
  const activeTab = useAppNavStore((s) => s.activeTab);
  const setTab = useAppNavStore((s) => s.setTab);
  const openPracticeRoom = useAppNavStore((s) => s.openPracticeRoom);

  const [gestures, setGestures] = useState<GestureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDictionaryGestures();
        if (mounted) {
          setGestures(result.gestures);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load gestures");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return gestures;
    }
    return gestures.filter(
      (gesture) =>
        gesture.label.toLowerCase().includes(q) ||
        gesture.alternatives.some((alt) => alt.toLowerCase().includes(q)) ||
        categoryDisplayName(gesture.category).toLowerCase().includes(q),
    );
  }, [gestures, query]);

  const onTabChange = (tab: MainTab): void => {
    setTab(tab);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Practice Room</Text>
        <Text style={styles.subtitle}>
          Pick a gesture, mirror the sample, and get live accuracy feedback.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search practice gestures..."
          placeholderTextColor={colors.placeholder}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading gestures…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Unable to load practice list</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && visible.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No gestures found</Text>
            <Text style={styles.stateText}>Try another search term.</Text>
          </View>
        ) : null}

        {visible.map((gesture) => (
          <Pressable
            key={gesture.gestureId}
            accessibilityRole="button"
            onPress={() => openPracticeRoom(gesture.gestureId)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{gesture.label}</Text>
              <Text style={styles.cardMeta}>
                {categoryDisplayName(gesture.category)} · {gesture.difficulty}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {gesture.description}
              </Text>
            </View>
            <Text style={styles.cta}>Practice →</Text>
          </Pressable>
        ))}

        {!loading && visible.length > 0 ? (
          <View style={styles.hintWrap}>
            <PrimaryButton
              label={`Start with ${visible[0]?.label ?? "first gesture"}`}
              onPress={() => {
                const first = visible[0];
                if (first) {
                  openPracticeRoom(first.gestureId);
                }
              }}
            />
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
    lineHeight: 20,
  },
  search: {
    minHeight: touchMin,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: {
    borderColor: "#B8D4F0",
    transform: [{ scale: 0.985 }],
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
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
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  hintWrap: {
    marginTop: 8,
  },
});
