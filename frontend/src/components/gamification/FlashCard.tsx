import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { FlashCardItem } from "../../types/gamification";
import { colors, radii } from "../../utils/theme";
import { getGestureVideoUrl } from "../../utils/videoMap";

const { width: SCREEN_W } = Dimensions.get("window");

interface FlashCardProps {
  card: FlashCardItem;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ card, isFlipped, onFlip }: FlashCardProps): JSX.Element {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const videoUrl = card.videoUrl || getGestureVideoUrl(card.title) || "";
  const hasVideo = Boolean(videoUrl && videoUrl.length > 0);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, animatedValue]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      {/* Front Face: Word & Category */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          {
            opacity: frontOpacity,
            transform: [{ rotateY: frontInterpolate }],
          },
        ]}
      >
        <View style={styles.badgeTop}>
          <Text style={styles.categoryText}>{card.category.toUpperCase()}</Text>
          {card.mastered && (
            <View style={styles.masteredBadge}>
              <Text style={styles.masteredText}>★ Mastered</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardEmoji}>{card.emoji}</Text>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardHint}>Tap card to reveal video gesture</Text>
      </Animated.View>

      {/* Back Face: Video Demo & Description */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            opacity: backOpacity,
            transform: [{ rotateY: backInterpolate }],
          },
        ]}
      >
        <View style={styles.backHeader}>
          <Text style={styles.backTitle}>{card.title}</Text>
          <Text style={styles.tapBackHint}>Tap to flip back</Text>
        </View>

        <View style={styles.videoStage}>
          {hasVideo ? (
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: videoUrl }}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={isFlipped}
              isMuted
              useNativeControls={false}
              onLoadStart={() => setVideoLoading(true)}
              onReadyForDisplay={() => setVideoLoading(false)}
            />
          ) : (
            <View style={styles.noVideoBox}>
              <Text style={styles.noVideoEmoji}>🤟</Text>
              <Text style={styles.noVideoText}>Clip demonstration in production</Text>
            </View>
          )}

          {videoLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={styles.descriptionText} numberOfLines={3}>
          {card.description || "Practice standard ASL handshape and motion."}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W - 36,
    height: 380,
    alignSelf: "center",
  },
  cardFace: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 20,
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
  },
  cardFront: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  badgeTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  masteredBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  masteredText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
  },
  cardEmoji: {
    fontSize: 64,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  cardHint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  cardBack: {
    backgroundColor: colors.surface,
    gap: 10,
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  tapBackHint: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  videoStage: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: radii.md,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  noVideoBox: {
    alignItems: "center",
    gap: 6,
  },
  noVideoEmoji: {
    fontSize: 32,
  },
  noVideoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
