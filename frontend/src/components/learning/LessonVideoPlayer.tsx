import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatDuration } from "../../services/lessonService";
import { colors, radii, touchMin } from "../../utils/theme";

interface LessonVideoPlayerProps {
  videoUrl: string;
  title: string;
  durationSeconds: number;
  gestures: string[];
}

export function LessonVideoPlayer({
  videoUrl,
  title,
  durationSeconds,
  gestures,
}: LessonVideoPlayerProps): JSX.Element {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(durationSeconds * 1000);
  const [loading, setLoading] = useState(Boolean(videoUrl));
  const [error, setError] = useState<string | null>(
    videoUrl ? null : "Video preview unavailable — follow the gesture guide below.",
  );
  const hasVideo = videoUrl.length > 0 && !error?.startsWith("Unable");

  useEffect(() => {
    setLoading(Boolean(videoUrl));
    setError(
      videoUrl ? null : "Video preview unavailable — follow the gesture guide below.",
    );
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(durationSeconds * 1000);
  }, [videoUrl, durationSeconds]);

  const onStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        setError("Unable to load video");
        setLoading(false);
      }
      return;
    }
    setLoading(false);
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    if (status.durationMillis) {
      setDurationMs(status.durationMillis);
    }
  };

  const togglePlay = async (): Promise<void> => {
    if (!videoRef.current || !hasVideo) {
      return;
    }
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const replay = async (): Promise<void> => {
    if (!videoRef.current || !hasVideo) {
      return;
    }
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.playAsync();
  };

  const seekRatio = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const displaySeconds = Math.floor(positionMs / 1000);
  const totalDisplaySeconds = Math.max(1, Math.floor(durationMs / 1000));

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {hasVideo ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: videoUrl }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isMuted
            useNativeControls={false}
            onPlaybackStatusUpdate={onStatusUpdate}
            onError={() => {
              setError("Unable to load video");
              setLoading(false);
            }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🤟</Text>
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.placeholderHint}>
              {gestures.join(" · ")}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          disabled={!hasVideo}
          onPress={() => void togglePlay()}
          style={({ pressed }) => [
            styles.controlBtn,
            !hasVideo && styles.controlDisabled,
            pressed && hasVideo && styles.controlPressed,
          ]}
        >
          <Text style={styles.controlIcon}>{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>

        <View style={styles.seekBlock}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${seekRatio * 100}%` }]} />
          </View>
          <Text style={styles.time}>
            {formatDuration(displaySeconds)} / {formatDuration(totalDisplaySeconds)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay"
          disabled={!hasVideo}
          onPress={() => void replay()}
          style={({ pressed }) => [
            styles.controlBtn,
            !hasVideo && styles.controlDisabled,
            pressed && hasVideo && styles.controlPressed,
          ]}
        >
          <Text style={styles.controlIcon}>↺</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stage: {
    aspectRatio: 16 / 9,
    backgroundColor: "#1a1f26",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  placeholderHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  errorBanner: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  controlBtn: {
    minWidth: touchMin - 4,
    minHeight: touchMin - 4,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  controlPressed: {
    backgroundColor: colors.primary,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  controlIcon: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primaryPressed,
  },
  seekBlock: {
    flex: 1,
    gap: 4,
  },
  track: {
    height: 8,
    backgroundColor: "#E8ECF0",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
