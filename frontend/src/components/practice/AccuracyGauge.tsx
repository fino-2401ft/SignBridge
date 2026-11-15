import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getPracticeFeedback } from "../../utils/practiceFeedback";
import { colors, radii } from "../../utils/theme";

interface AccuracyGaugeProps {
  score: number;
}

export function AccuracyGauge({ score }: AccuracyGaugeProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const feedback = getPracticeFeedback(clamped);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.row}>
        <Text style={styles.icon}>{feedback.icon}</Text>
        <Text style={[styles.message, { color: feedback.color }]}>
          {clamped}% · {feedback.message}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: feedback.color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  track: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
