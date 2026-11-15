import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LessonVideoPlayer } from "../learning/LessonVideoPlayer";
import { colors } from "../../utils/theme";

interface ReferenceVideoPanelProps {
  label: string;
  description: string;
  videoUrl: string;
}

export function ReferenceVideoPanel({
  label,
  description,
  videoUrl,
}: ReferenceVideoPanelProps): JSX.Element {
  return (
    <View style={styles.panel}>
      <LessonVideoPlayer
        videoUrl={videoUrl}
        title={label}
        durationSeconds={12}
        gestures={[label]}
      />
      <View style={styles.meta}>
        <Text style={styles.label}>Gesture: {label}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description || "Watch the sample, then mirror it in the camera below."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    gap: 8,
  },
  meta: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
