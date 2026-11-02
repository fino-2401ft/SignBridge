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
import { useAppNavStore } from "../../stores/useAppNavStore";
import { useDictionaryStore } from "../../stores/useDictionaryStore";
import { categoryDisplayName } from "../../types/gesture";
import { colors, radii, touchMin } from "../../utils/theme";

interface GestureDetailScreenProps {
  gestureId: string;
}

export function GestureDetailScreen({
  gestureId,
}: GestureDetailScreenProps): JSX.Element {
  const goBackDictionary = useAppNavStore((s) => s.goBackDictionary);
  const setTab = useAppNavStore((s) => s.setTab);
  const getGestureById = useDictionaryStore((s) => s.getGestureById);
  const gestures = useDictionaryStore((s) => s.gestures);

  const [toast, setToast] = useState<string | null>(null);

  const gesture = useMemo(
    () => getGestureById(gestureId),
    [getGestureById, gestureId, gestures],
  );

  if (!gesture) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable onPress={goBackDictionary} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Gesture unavailable</Text>
          <Text style={styles.missingText}>This sign could not be found.</Text>
          <PrimaryButton label="Back to dictionary" onPress={goBackDictionary} />
        </View>
      </View>
    );
  }

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
          accessibilityLabel="Back to dictionary"
          onPress={goBackDictionary}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LessonVideoPlayer
          videoUrl={gesture.videoUrl}
          title={gesture.label}
          durationSeconds={12}
          gestures={[gesture.label]}
        />

        <Text style={styles.title}>{gesture.label}</Text>
        {gesture.pronunciation ? (
          <Text style={styles.pronunciation}>{gesture.pronunciation}</Text>
        ) : null}

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {categoryDisplayName(gesture.category)}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeSoft]}>
            <Text style={styles.badgeTextSoft}>{gesture.difficulty}</Text>
          </View>
          {gesture.isDynamic ? (
            <View style={[styles.badge, styles.badgeSoft]}>
              <Text style={styles.badgeTextSoft}>Dynamic</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeSoft]}>
              <Text style={styles.badgeTextSoft}>Static</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>Description</Text>
        <Text style={styles.description}>
          {gesture.description || "No description available for this gesture yet."}
        </Text>

        {gesture.alternatives.length > 0 ? (
          <>
            <Text style={styles.section}>Also known as</Text>
            <Text style={styles.description}>{gesture.alternatives.join(" · ")}</Text>
          </>
        ) : null}

        {gesture.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {gesture.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton
          label="Add to Practice List"
          onPress={() => {
            setToast(`“${gesture.label}” saved for Practice`);
            setTimeout(() => setToast(null), 2200);
          }}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => setTab("Practice")}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryText}>Open Practice →</Text>
        </Pressable>
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
    gap: 4,
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  pronunciation: {
    marginTop: 2,
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSoft: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
  badgeTextSoft: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  section: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  secondaryBtn: {
    marginTop: 12,
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryPressed: {
    borderColor: colors.primary,
  },
  secondaryText: {
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
  toast: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    zIndex: 20,
    backgroundColor: "#1e8449",
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
