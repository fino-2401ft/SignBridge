import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Sign, SignDifficulty } from "../../types/dictionary";
import { colors, radii, touchMin } from "../../utils/theme";

interface DictionaryDetailModalProps {
  sign: Sign | null;
  visible: boolean;
  onClose: () => void;
}

type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.5;
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.5];

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

export function DictionaryDetailModal({
  sign,
  visible,
  onClose,
}: DictionaryDetailModalProps): JSX.Element | null {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(1);
  const [videoError, setVideoError] = useState<string | null>(null);

  const hasVideo = Boolean(sign?.videoUrl && sign.videoUrl.trim().length > 0 && !videoError);

  useEffect(() => {
    if (visible && sign) {
      setIsPlaying(false);
      setPositionMs(0);
      setDurationMs(1);
      setSpeed(1.0);
      setVideoError(null);
      setLoading(Boolean(sign.videoUrl));
    }
  }, [visible, sign]);

  if (!sign) {
    return null;
  }

  const diffTone = getDifficultyTone(sign.difficulty);

  const onStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        setVideoError("Unable to load video sample");
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

  const changeSpeed = async (newSpeed: PlaybackSpeed): Promise<void> => {
    setSpeed(newSpeed);
    if (videoRef.current && hasVideo) {
      await videoRef.current.setRateAsync(newSpeed, true);
    }
  };

  const progressPercent = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.emojiBadge}>
                <Text style={styles.emojiText}>{sign.emoji}</Text>
              </View>
              <View style={styles.titleInfo}>
                <Text style={styles.title}>{sign.title}</Text>
                <View style={styles.pillRow}>
                  <View style={[styles.pill, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.pillText, { color: colors.primary }]}>
                      {sign.category}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: diffTone.bg }]}>
                    <Text style={[styles.pillText, { color: diffTone.text }]}>
                      {sign.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sign details"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Video Player Stage */}
          <View style={styles.stage}>
            {hasVideo ? (
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: sign.videoUrl }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping
                isMuted
                useNativeControls={false}
                onPlaybackStatusUpdate={onStatusUpdate}
                onError={() => {
                  setVideoError("Unable to stream video demonstration.");
                  setLoading(false);
                }}
              />
            ) : (
              <View style={styles.placeholderStage}>
                <Text style={styles.placeholderEmoji}>🤟</Text>
                <Text style={styles.placeholderTitle}>{sign.title}</Text>
                <Text style={styles.placeholderSub}>
                  {videoError ?? "Official gesture video demonstration in production"}
                </Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Video Controls & Speed Bar */}
          {hasVideo && (
            <View style={styles.controlsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
                onPress={() => void togglePlay()}
                style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlPressed]}
              >
                <Text style={styles.ctrlIcon}>{isPlaying ? "❚❚" : "▶"}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Replay"
                onPress={() => void replay()}
                style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlPressed]}
              >
                <Text style={styles.ctrlIcon}>↺</Text>
              </Pressable>

              <View style={styles.seekContainer}>
                <View style={styles.seekTrack}>
                  <View style={[styles.seekFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              <View style={styles.speedRow}>
                {PLAYBACK_SPEEDS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => void changeSpeed(s)}
                    style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
                  >
                    <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
                      {s}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Gesture Explanation & Guide */}
          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>Gesture Instructions</Text>
            <Text style={styles.descriptionText}>
              {sign.description || "Form the handshape clearly and position at chest/chin level."}
            </Text>

            {sign.keywords && sign.keywords.length > 0 && (
              <View style={styles.keywordsSection}>
                <Text style={styles.keywordTitle}>Associated Keywords</Text>
                <View style={styles.keywordWrap}>
                  {sign.keywords.map((kw, idx) => (
                    <View key={idx} style={styles.keywordChip}>
                      <Text style={styles.keywordText}>#{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close Action */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={onClose}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
          >
            <Text style={styles.doneBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 80, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 24,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  stage: {
    aspectRatio: 16 / 9,
    backgroundColor: "#1a1f26",
    borderRadius: radii.md,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholderStage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 38,
  },
  placeholderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  placeholderSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlPressed: {
    backgroundColor: colors.primary,
  },
  ctrlIcon: {
    fontSize: 14,
    color: colors.primaryPressed,
    fontWeight: "800",
  },
  seekContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  seekTrack: {
    height: 6,
    backgroundColor: "#E8ECF0",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  seekFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  speedRow: {
    flexDirection: "row",
    gap: 4,
  },
  speedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  speedBtnActive: {
    backgroundColor: colors.primary,
  },
  speedText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  speedTextActive: {
    color: "#FFFFFF",
  },
  detailsScroll: {
    marginTop: 14,
    maxHeight: 180,
  },
  detailsContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  keywordsSection: {
    marginTop: 12,
  },
  keywordTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  keywordChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keywordText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  doneBtn: {
    marginTop: 16,
    minHeight: touchMin,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnPressed: {
    backgroundColor: colors.primary,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
});
