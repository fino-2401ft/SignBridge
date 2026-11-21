import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getGestureVideoUrl } from "../../utils/videoMap";
import { colors, radii, touchMin } from "../../utils/theme";

const { width: SCREEN_W } = Dimensions.get("window");

type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.5;
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.5];

interface SentencePlayerModalProps {
  visible: boolean;
  onClose: () => void;
  originalPhrase: string;
  glossTokens: string[];
}

export function SentencePlayerModal({
  visible,
  onClose,
  originalPhrase,
  glossTokens,
}: SentencePlayerModalProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<Video>(null);
  const scrollRef = useRef<any>(null);

  const currentToken = glossTokens[currentIndex] || "";
  const videoUrl = getGestureVideoUrl(currentToken);
  const hasVideo = Boolean(videoUrl && videoUrl.length > 0 && !error);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setIsPlaying(true);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    setError(null);
    setLoading(Boolean(videoUrl));
  }, [currentIndex, videoUrl]);

  // Center active token in timeline scroll
  useEffect(() => {
    if (scrollRef.current && glossTokens.length > 0) {
      const itemW = 90;
      const targetX = Math.max(0, currentIndex * itemW - SCREEN_W / 2 + itemW / 2);
      if (typeof scrollRef.current.scrollTo === "function") {
        scrollRef.current.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [currentIndex, glossTokens.length]);

  const onStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        setError("Unable to stream video demonstration");
        setLoading(false);
      }
      return;
    }
    setLoading(false);
    setIsPlaying(status.isPlaying);

    // Auto-advance to next sign when current video completes
    if (status.didJustFinish) {
      if (currentIndex < glossTokens.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = async (): Promise<void> => {
    if (!videoRef.current || !hasVideo) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const replayCurrent = async (): Promise<void> => {
    if (!videoRef.current || !hasVideo) return;
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.playAsync();
  };

  const nextWord = (): void => {
    if (currentIndex < glossTokens.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevWord = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const changeSpeed = async (newSpeed: PlaybackSpeed): Promise<void> => {
    setSpeed(newSpeed);
    if (videoRef.current && hasVideo) {
      await videoRef.current.setRateAsync(newSpeed, true);
    }
  };

  if (!visible || glossTokens.length === 0) {
    return null;
  }

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
            <View style={styles.headerInfo}>
              <Text style={styles.sheetTitle}>ASL Sentence Player</Text>
              <Text style={styles.sheetSub} numberOfLines={1}>
                {originalPhrase || "Sentence Sequence"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Current Word Indicator */}
          <View style={styles.wordIndicator}>
            <Text style={styles.wordIndex}>
              Word {currentIndex + 1} of {glossTokens.length}
            </Text>
            <Text style={styles.activeWordText}>{currentToken.toUpperCase()}</Text>
          </View>

          {/* Video Player Stage */}
          <View style={styles.stage}>
            {hasVideo ? (
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: videoUrl }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isMuted
                useNativeControls={false}
                onPlaybackStatusUpdate={onStatusUpdate}
                onError={() => {
                  setError("Unable to load sign video");
                  setLoading(false);
                }}
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderEmoji}>🤟</Text>
                <Text style={styles.placeholderWord}>{currentToken.toUpperCase()}</Text>
                <Text style={styles.placeholderNote}>
                  {error ?? "Gesture clip in production — practice the motion below"}
                </Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Player Navigation & Speed Controls */}
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous Word"
              disabled={currentIndex === 0}
              onPress={prevWord}
              style={({ pressed }) => [
                styles.ctrlBtn,
                currentIndex === 0 && styles.ctrlDisabled,
                pressed && styles.ctrlPressed,
              ]}
            >
              <Text style={styles.ctrlIcon}>|◀</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
              onPress={() => void togglePlay()}
              style={({ pressed }) => [styles.playBtn, pressed && styles.ctrlPressed]}
            >
              <Text style={styles.playIcon}>{isPlaying ? "❚❚" : "▶"}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Replay"
              onPress={() => void replayCurrent()}
              style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlPressed]}
            >
              <Text style={styles.ctrlIcon}>↺</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next Word"
              disabled={currentIndex >= glossTokens.length - 1}
              onPress={nextWord}
              style={({ pressed }) => [
                styles.ctrlBtn,
                currentIndex >= glossTokens.length - 1 && styles.ctrlDisabled,
                pressed && styles.ctrlPressed,
              ]}
            >
              <Text style={styles.ctrlIcon}>▶|</Text>
            </Pressable>

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

          {/* Timeline of Gloss Tokens */}
          <View style={styles.timelineSection}>
            <Text style={styles.timelineLabel}>SENTENCE TIMELINE</Text>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineScroll}
            >
              {glossTokens.map((token, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <Pressable
                    key={`${token}-${idx}`}
                    onPress={() => setCurrentIndex(idx)}
                    style={[styles.tokenChip, isActive && styles.tokenChipActive]}
                  >
                    <Text style={[styles.tokenText, isActive && styles.tokenTextActive]}>
                      {token.toUpperCase()}
                    </Text>
                    {isActive && <View style={styles.activeDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Close Action */}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.donePressed]}
          >
            <Text style={styles.doneText}>Close Player</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  sheetSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  closePressed: {
    opacity: 0.7,
  },
  closeIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  wordIndicator: {
    alignItems: "center",
    paddingVertical: 6,
  },
  wordIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  activeWordText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  stage: {
    aspectRatio: 16 / 9,
    backgroundColor: "#0F172A",
    borderRadius: radii.md,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 6,
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  placeholderWord: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  placeholderNote: {
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlPressed: {
    backgroundColor: colors.primary,
  },
  ctrlDisabled: {
    opacity: 0.35,
  },
  ctrlIcon: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryPressed,
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  speedRow: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 6,
  },
  speedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  speedBtnActive: {
    backgroundColor: colors.primary,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  speedTextActive: {
    color: "#FFFFFF",
  },
  timelineSection: {
    marginTop: 14,
  },
  timelineLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timelineScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tokenChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  tokenChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tokenText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tokenTextActive: {
    color: colors.primary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  doneBtn: {
    marginTop: 16,
    minHeight: touchMin,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  donePressed: {
    backgroundColor: colors.primary,
  },
  doneText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryPressed,
  },
});
