import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import type { LandmarkPoint } from "../../utils/landmarkNormalizer";
import { colors } from "../../utils/theme";

interface SkeletonOverlayProps {
  landmarks?: LandmarkPoint[];
  width: number;
  height: number;
  detected: boolean;
}

export function SkeletonOverlay({
  landmarks,
  width,
  height,
  detected,
}: SkeletonOverlayProps): JSX.Element | null {
  if (!detected || !landmarks || landmarks.length < 21) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
      {landmarks.map((pt, idx) => {
        // Map 0-1 normalized coords to canvas width & height
        const posX = pt.x * width;
        const posY = pt.y * height;

        return (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                left: posX - 4,
                top: posY - 4,
                backgroundColor: idx === 0 ? colors.warning : colors.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "transparent",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
