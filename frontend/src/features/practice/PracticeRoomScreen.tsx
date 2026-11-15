import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraPreviewPanel } from "../../components/practice/CameraPreviewPanel";
import { ReferenceVideoPanel } from "../../components/practice/ReferenceVideoPanel";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { fetchDictionaryGestures } from "../../services/dictionaryService";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { usePracticeStore } from "../../stores/usePracticeStore";
import type { GestureDTO } from "../../types/gesture";
import { colors, radii, touchMin } from "../../utils/theme";

interface PracticeRoomScreenProps {
  gestureId: string;
}

export function PracticeRoomScreen({
  gestureId,
}: PracticeRoomScreenProps): JSX.Element {
  const goBackPractice = useAppNavStore((s) => s.goBackPractice);
  const openPracticeSummary = useAppNavStore((s) => s.openPracticeSummary);

  const startSession = usePracticeStore((s) => s.startSession);
  const setTargetGesture = usePracticeStore((s) => s.setTargetGesture);
  const tickScore = usePracticeStore((s) => s.tickScore);
  const endSession = usePracticeStore((s) => s.endSession);
  const accuracyScore = usePracticeStore((s) => s.accuracyScore);
  const handState = usePracticeStore((s) => s.handState);
  const lightingWarning = usePracticeStore((s) => s.lightingWarning);
  const isSaving = usePracticeStore((s) => s.isSaving);
  const targetGestureLabel = usePracticeStore((s) => s.targetGestureLabel);

  const [gestures, setGestures] = useState<GestureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const result = await fetchDictionaryGestures();
        if (!mounted) {
          return;
        }
        setGestures(result.gestures);
        const selected =
          result.gestures.find((item) => item.gestureId === gestureId) ??
          result.gestures[0];
        if (selected) {
          startSession(selected.gestureId, selected.label);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [gestureId, startSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      tickScore();
    }, 400);
    return () => clearInterval(timer);
  }, [tickScore]);

  const activeGesture = useMemo(() => {
    return (
      gestures.find((item) => item.label === targetGestureLabel) ??
      gestures.find((item) => item.gestureId === gestureId) ??
      null
    );
  }, [gestures, gestureId, targetGestureLabel]);

  const onEndPractice = async (): Promise<void> => {
    const session = await endSession();
    if (session) {
      openPracticeSummary(session.sessionId);
      return;
    }
    goBackPractice();
  };

  if (loading || !activeGesture) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.bootText}>Preparing practice room…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void onEndPractice()}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕ Close</Text>
        </Pressable>
        <Text style={styles.topTitle}>Practice Room</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.split}>
        <View style={styles.half}>
          <ReferenceVideoPanel
            label={activeGesture.label}
            description={activeGesture.description}
            videoUrl={activeGesture.videoUrl}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.half}>
          <CameraPreviewPanel
            score={accuracyScore}
            handState={handState}
            lightingWarning={lightingWarning}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={styles.selector}
        >
          <Text style={styles.selectorLabel}>Select Gesture</Text>
          <Text style={styles.selectorValue}>{activeGesture.label} ▼</Text>
        </Pressable>
        <PrimaryButton
          label="End Practice"
          loading={isSaving}
          onPress={() => void onEndPractice()}
        />
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Choose a gesture</Text>
            <ScrollView style={styles.sheetList}>
              {gestures.map((gesture) => (
                <Pressable
                  key={gesture.gestureId}
                  onPress={() => {
                    setTargetGesture(gesture.gestureId, gesture.label);
                    setPickerOpen(false);
                  }}
                  style={styles.sheetItem}
                >
                  <Text style={styles.sheetItemText}>{gesture.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 10,
  },
  bootText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: touchMin,
  },
  closeBtn: {
    minHeight: touchMin,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  closeText: {
    color: colors.primary,
    fontWeight: "800",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  topSpacer: {
    width: 64,
  },
  split: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  half: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  footer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 8,
  },
  selector: {
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  selectorValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,62,80,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "55%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },
  sheetList: {
    maxHeight: 320,
  },
  sheetItem: {
    minHeight: touchMin,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});
