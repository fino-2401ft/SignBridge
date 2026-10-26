import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LessonListItem } from "../../components/learning/LessonListItem";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useLearningStore } from "../../stores/useLearningStore";
import { useLearningNavStore } from "../../stores/useLearningNavStore";
import { useLessonStore } from "../../stores/useLessonStore";
import type { LessonViewModel } from "../../types/lesson";
import { colors, touchMin } from "../../utils/theme";

interface PathDetailScreenProps {
  pathId: string;
}

export function PathDetailScreen({ pathId }: PathDetailScreenProps): JSX.Element {
  const goBack = useLearningNavStore((s) => s.goBack);
  const openLesson = useLearningNavStore((s) => s.openLesson);

  const path = useLearningStore((s) => s.paths.find((p) => p.id === pathId));
  const progress = useLearningStore((s) => s.progressByPathId[pathId]);

  const loadLessons = useLessonStore((s) => s.loadLessons);
  const loadState = useLessonStore((s) => s.loadState);
  const errorMessage = useLessonStore((s) => s.errorMessage);
  const lessons = useLessonStore((s) => s.lessons);
  const getLessonViewModels = useLessonStore((s) => s.getLessonViewModels);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void loadLessons(pathId);
  }, [loadLessons, pathId]);

  const items = useMemo(
    () => getLessonViewModels(),
    [getLessonViewModels, lessons, progress],
  );

  const completedCount = progress?.completedLessonIds.length ?? 0;
  const totalCount = path?.lessonCount ?? lessons.length;
  const percent = progress?.progressPercent ?? 0;

  const onLessonPress = (item: LessonViewModel): void => {
    if (item.status === "locked") {
      setToast("Complete previous lessons first");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    openLesson(pathId, item.lesson.id);
  };

  return (
    <View style={styles.root}>
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.icon}>{path?.icon ?? "📚"}</Text>
        <Text style={styles.title}>{path?.title ?? "Learning path"}</Text>
        <Text style={styles.subtitle}>
          {completedCount}/{totalCount} lessons · {percent}% complete
        </Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, percent)}%` }]} />
        </View>

        <Text style={styles.section}>Lessons</Text>

        {loadState === "loading" || loadState === "idle" ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading lessons…</Text>
          </View>
        ) : null}

        {loadState === "empty" ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No lessons yet</Text>
            <Text style={styles.stateText}>Lessons for this path are coming soon.</Text>
          </View>
        ) : null}

        {loadState === "error" ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Unable to load lessons</Text>
            <Text style={styles.stateText}>{errorMessage ?? "Please try again."}</Text>
            <View style={styles.retryWrap}>
              <PrimaryButton label="Retry" onPress={() => void loadLessons(pathId)} />
            </View>
          </View>
        ) : null}

        {loadState === "ready"
          ? items.map((item) => (
              <View key={item.lesson.id} style={styles.itemWrap}>
                <LessonListItem item={item} onPress={onLessonPress} />
              </View>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    minHeight: touchMin,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  backPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  track: {
    marginTop: 14,
    marginBottom: 22,
    height: 10,
    backgroundColor: "#E8ECF0",
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  section: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  itemWrap: {
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
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryWrap: {
    marginTop: 8,
    width: "100%",
    maxWidth: 220,
  },
  toast: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    zIndex: 20,
    backgroundColor: "#2C3E50",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toastText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});
