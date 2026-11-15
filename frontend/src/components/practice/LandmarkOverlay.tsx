import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import type { HandDetectionState } from "../../types/practice";
import { colors } from "../../utils/theme";

interface LandmarkOverlayProps {
  handState: HandDetectionState;
  score: number;
}

/** Lightweight 21-point hand skeleton stub for Practice HUD (FR-013). */
const POINTS: Array<{ left: string; top: string }> = [
  { left: "48%", top: "78%" },
  { left: "38%", top: "70%" },
  { left: "30%", top: "60%" },
  { left: "24%", top: "50%" },
  { left: "20%", top: "42%" },
  { left: "44%", top: "58%" },
  { left: "42%", top: "46%" },
  { left: "40%", top: "34%" },
  { left: "39%", top: "24%" },
  { left: "52%", top: "56%" },
  { left: "52%", top: "42%" },
  { left: "52%", top: "30%" },
  { left: "52%", top: "20%" },
  { left: "60%", top: "58%" },
  { left: "62%", top: "46%" },
  { left: "64%", top: "34%" },
  { left: "65%", top: "24%" },
  { left: "68%", top: "62%" },
  { left: "72%", top: "52%" },
  { left: "75%", top: "42%" },
  { left: "78%", top: "34%" },
];

export function LandmarkOverlay({
  handState,
  score,
}: LandmarkOverlayProps): JSX.Element | null {
  if (handState === "not_detected") {
    return null;
  }

  const color =
    score >= 85
      ? colors.success
      : handState === "partial"
        ? colors.warning
        : "#06B6D4";

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={[styles.zone, { borderColor: color }]} />
      {POINTS.map((point, index) => (
        <View
          key={`lm-${index}`}
          style={[
            styles.dot,
            {
              left: point.left,
              top: point.top,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  zone: {
    position: "absolute",
    left: "18%",
    top: "16%",
    width: "64%",
    height: "68%",
    borderWidth: 2,
    borderRadius: 18,
    borderStyle: "dashed",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
  },
});
