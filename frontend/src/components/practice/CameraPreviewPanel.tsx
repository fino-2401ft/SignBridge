import { CameraView, useCameraPermissions } from "expo-camera";
import type { JSX } from "react";
import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { HandDetectionState } from "../../types/practice";
import { colors, touchMin } from "../../utils/theme";
import { AccuracyGauge } from "./AccuracyGauge";
import { LandmarkOverlay } from "./LandmarkOverlay";

interface CameraPreviewPanelProps {
  score: number;
  handState: HandDetectionState;
  lightingWarning: boolean;
}

function handStateLabel(state: HandDetectionState): string {
  switch (state) {
    case "detected":
      return "Hand detected";
    case "partial":
      return "Partial hand visible";
    case "multiple":
      return "Multiple hands — using dominant";
    default:
      return "Hand not detected";
  }
}

export function CameraPreviewPanel({
  score,
  handState,
  lightingWarning,
}: CameraPreviewPanelProps): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.panel}>
        <Text style={styles.centerText}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.panel}>
        <Text style={styles.deniedTitle}>Camera access is required for practice</Text>
        <Text style={styles.deniedText}>
          Enable camera permission to see live feedback while you sign.
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void requestPermission()}
            style={styles.permissionBtn}
          >
            <Text style={styles.permissionText}>Allow Camera</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
            style={styles.permissionBtn}
          >
            <Text style={styles.permissionText}>Open Settings</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <CameraView style={styles.camera} facing="front" mirror />
      <LandmarkOverlay handState={handState} score={score} />

      <View style={styles.hudTop}>
        <Text style={styles.hudLabel}>{handStateLabel(handState)}</Text>
      </View>

      {lightingWarning ? (
        <View style={styles.warnBanner}>
          <Text style={styles.warnText}>
            Improve lighting for better recognition
          </Text>
        </View>
      ) : null}

      {handState === "not_detected" ? (
        <View style={styles.guide}>
          <Text style={styles.guideText}>Place your hand in the frame</Text>
        </View>
      ) : null}

      <View style={styles.gaugeWrap}>
        <AccuracyGauge score={score} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#0F172A",
    overflow: "hidden",
    borderRadius: 16,
    justifyContent: "center",
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  centerText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
  deniedTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  deniedText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 16,
    alignSelf: "center",
    minHeight: touchMin,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  hudTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
  },
  hudLabel: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(15,23,42,0.7)",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  warnBanner: {
    position: "absolute",
    top: 44,
    left: 10,
    right: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  warnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  guide: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.35)",
  },
  guideText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  gaugeWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
});
