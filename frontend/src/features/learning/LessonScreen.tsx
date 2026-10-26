import type { JSX } from "react";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LessonVideoPlayer } from "../../components/learning/LessonVideoPlayer";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useLearningNavStore } from "../../stores/useLearningNavStore";
import { useLessonStore } from "../../stores/useLessonStore";
import { colors, radii, touchMin } from "../../utils/theme";

interface LessonScreenProps {
  pathId: string;
  lessonId: string;
}

export function LessonScreen({ pathId, lessonId }: LessonScreenProps): JSX.Element {
  const goBack = useLearningNavStore((s) => s.goBack);
  const openLesson = useLearningNavStore((s) => s.openLesson);
  const openPath = useLearningNavStore((s) => s.openPath);

  const lessons = useLessonStore((s) => s.lessons);
  const getLessonViewModels = useLessonStore((s) => s.getLessonViewModels);
  const markLessonComplete = useLessonStore((s) => s.markLessonComplete);
  const isCompleting = useLessonStore((s) => s.isCompleting);

  const [banner, setBanner] = useState<string | null>(null);
  const [completedHere, setCompletedHere] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  const lesson = useMemo(
    () => lessons.find((item) => item.id === lessonId),
    [lessons, lessonId],
  );

  const view = useMemo(() => {
    return getLessonViewModels().find((item) => item.lesson.id === lessonId);
  }, [getLessonViewModels, lessonId, lessons]);

  const alreadyComplete = view?.status === "completed" || completedHere;

  const onComplete = async (): Promise<void> => {
    setBanner(null);
    try {
      const result = await markLessonComplete(lessonId);
      setCompletedHere(true);
      setNextLessonId(result.nextLessonId);
      if (result.awardedXp > 0) {
        setBanner(
          result.xpPendingSync
            ? `Lesson complete · +${result.awardedXp} XP (sync pending)`
            : `Lesson complete · +${result.awardedXp} XP`,
        );
      } else {
        setBanner("Lesson already completed");
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not mark complete.");
    }
  };

  if (!lesson) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Lesson unavailable</Text>
          <Text style={styles.missingText}>This lesson could not be found.</Text>
          <PrimaryButton label="Back to path" onPress={() => openPath(pathId)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to path"
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Lesson {lesson.order}</Text>
        <Text style={styles.title}>{lesson.title}</Text>

        <View style={styles.playerWrap}>
          <LessonVideoPlayer
            videoUrl={lesson.videoUrl}
            title={lesson.title}
            durationSeconds={lesson.durationSeconds}
            gestures={lesson.gestures}
          />
        </View>

        <Text style={styles.section}>About this lesson</Text>
        <Text style={styles.description}>{lesson.description}</Text>

        <Text style={styles.section}>Gestures</Text>
        <View style={styles.chipRow}>
          {lesson.gestures.map((gesture) => (
            <View key={gesture} style={styles.chip}>
              <Text style={styles.chipText}>{gesture}</Text>
            </View>
          ))}
        </View>

        {banner ? (
          <View style={[styles.banner, alreadyComplete && styles.bannerSuccess]}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={alreadyComplete ? "Completed" : "Mark as Complete"}
          onPress={() => void onComplete()}
          loading={isCompleting}
          disabled={alreadyComplete && !isCompleting}
        />

        {alreadyComplete && nextLessonId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openLesson(pathId, nextLessonId)}
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextPressed]}
          >
            <Text style={styles.nextText}>Next Lesson →</Text>
          </Pressable>
        ) : null}

        {alreadyComplete && !nextLessonId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openPath(pathId)}
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextPressed]}
          >
            <Text style={styles.nextText}>Back to path</Text>
          </Pressable>
        ) : null}
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
    paddingBottom: 32,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  playerWrap: {
    marginBottom: 18,
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
  banner: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  bannerSuccess: {
    backgroundColor: colors.successSoft,
  },
  bannerText: {
    textAlign: "center",
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
  },
  nextBtn: {
    marginTop: 12,
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  nextPressed: {
    borderColor: colors.primary,
  },
  nextText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 8,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  missingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
});
