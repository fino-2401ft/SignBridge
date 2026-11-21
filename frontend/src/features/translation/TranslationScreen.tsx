import { CameraView, useCameraPermissions } from "expo-camera";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SentencePlayerModal } from "../../components/translation/SentencePlayerModal";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { translateToASLGlossWithAI } from "../../services/aiService";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { useTranslationStore } from "../../stores/useTranslationStore";
import { parseSentenceToASLGloss } from "../../utils/aslGrammarParser";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";

type TranslationMode = "text" | "camera";

const SAMPLE_PHRASES = [
  "Hello my friend",
  "Thank you very much",
  "I need water please",
  "Where is the bathroom?",
  "I love to learn ASL",
  "Are you happy today?",
];

export function TranslationScreen(): JSX.Element {
  const setTab = useAppNavStore((s) => s.setTab);
  const tokens = useTranslationStore((s) => s.tokens);
  const confidence = useTranslationStore((s) => s.confidence);
  const appendToken = useTranslationStore((s) => s.appendToken);
  const clearTokens = useTranslationStore((s) => s.clearTokens);
  const setConfidence = useTranslationStore((s) => s.setConfidence);

  const [mode, setMode] = useState<TranslationMode>("text");
  const [inputText, setInputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeGloss, setActiveGloss] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [playerVisible, setPlayerVisible] = useState(false);

  // Camera & WebSocket state
  const [permission, requestPermission] = useCameraPermissions();
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const handleTranslateText = useCallback(async (phraseToTranslate?: string) => {
    const text = (phraseToTranslate ?? inputText).trim();
    if (!text) return;

    setIsTranslating(true);
    try {
      // 1. Try AI-powered ASL translation
      const aiResult = await translateToASLGlossWithAI(text);
      if (aiResult.aslGloss.length > 0) {
        setActiveGloss(aiResult.aslGloss);
        setExplanation(aiResult.explanation);
      } else {
        // Fallback to local rule-based grammar parser
        const local = parseSentenceToASLGloss(text);
        setActiveGloss(local.parsedGloss.map((w) => w.toUpperCase()));
        setExplanation("Rule-based grammar structuring applied.");
      }
    } catch {
      const local = parseSentenceToASLGloss(text);
      setActiveGloss(local.parsedGloss.map((w) => w.toUpperCase()));
      setExplanation("Offline rule-based grammar applied.");
    } finally {
      setIsTranslating(false);
    }
  }, [inputText]);

  // WebSocket management for Live Camera Translation
  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsStreaming(false);
      setWsConnected(false);
      return;
    }

    const serverIp = process.env.EXPO_PUBLIC_AI_SERVER_IP || "192.168.1.5";
    const wsUrl = `ws://${serverIp}:8000/ws/translate`;
    setIsStreaming(true);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pred_word) {
            appendToken(data.pred_word);
            if (typeof data.confidence === "number") {
              setConfidence(data.confidence);
            }
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        setIsStreaming(false);
      };
    } catch {
      setIsStreaming(false);
      setWsConnected(false);
    }
  }, [isStreaming, appendToken, setConfidence]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const onTabChange = (tab: MainTab): void => {
    setTab(tab);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ASL Translator</Text>
        <Text style={styles.subtitle}>
          Bridge communication with ASL grammar translation & live detection
        </Text>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.switcher}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode("text")}
          style={[styles.switchBtn, mode === "text" && styles.switchBtnActive]}
        >
          <Text style={[styles.switchText, mode === "text" && styles.switchTextActive]}>
            Text to ASL
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode("camera")}
          style={[styles.switchBtn, mode === "camera" && styles.switchBtnActive]}
        >
          <Text style={[styles.switchText, mode === "camera" && styles.switchTextActive]}>
            Camera Live HUD
          </Text>
        </Pressable>
      </View>

      {/* Mode 1: Text to ASL Sequence */}
      {mode === "text" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>ENTER ENGLISH OR PHRASE</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. I want to meet my friend tomorrow…"
                placeholderTextColor={colors.placeholder}
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={3}
              />
              {inputText.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setInputText("")}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearText}>✕</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.translateAction}>
              <PrimaryButton
                label={isTranslating ? "Structuring ASL…" : "Translate to ASL Gloss"}
                onPress={() => void handleTranslateText()}
                loading={isTranslating}
              />
            </View>
          </View>

          {/* Sample Phrases Chips */}
          <View style={styles.samplesSection}>
            <Text style={styles.samplesLabel}>QUICK SAMPLE PHRASES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.samplesScroll}
            >
              {SAMPLE_PHRASES.map((phrase, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setInputText(phrase);
                    void handleTranslateText(phrase);
                  }}
                  style={({ pressed }) => [
                    styles.sampleChip,
                    pressed && styles.samplePressed,
                  ]}
                >
                  <Text style={styles.sampleChipText}>“{phrase}”</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Translation Result Card */}
          {activeGloss.length > 0 && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>ASL GLOSS STRUCTURE</Text>
                </View>
                <Text style={styles.tokenCount}>{activeGloss.length} Signs</Text>
              </View>

              <View style={styles.tokensWrap}>
                {activeGloss.map((token, idx) => (
                  <View key={idx} style={styles.glossPill}>
                    <Text style={styles.glossText}>{token}</Text>
                  </View>
                ))}
              </View>

              {explanation ? (
                <Text style={styles.explanationText}>ℹ️ {explanation}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => setPlayerVisible(true)}
                style={({ pressed }) => [
                  styles.playSequenceBtn,
                  pressed && styles.playSequencePressed,
                ]}
              >
                <Text style={styles.playSequenceIcon}>▶</Text>
                <Text style={styles.playSequenceText}>
                  Play Video Gesture Sequence
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Mode 2: Live Camera Recognition HUD */}
      {mode === "camera" && (
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionDesc}>
                Allow camera access to enable real-time gesture translation HUD.
              </Text>
              {permission?.canAskAgain ? (
                <PrimaryButton
                  label="Grant Camera Access"
                  onPress={() => void requestPermission()}
                />
              ) : (
                <PrimaryButton
                  label="Open Device Settings"
                  onPress={() => void Linking.openSettings()}
                />
              )}
            </View>
          ) : (
            <View style={styles.cameraStage}>
              <CameraView style={StyleSheet.absoluteFill} facing="front" mirror />

              <View style={styles.cameraHudTop}>
                <View
                  style={[
                    styles.wsStatusPill,
                    {
                      backgroundColor: wsConnected
                        ? colors.successSoft
                        : colors.warningSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.wsStatusText,
                      {
                        color: wsConnected ? colors.success : colors.warning,
                      },
                    ]}
                  >
                    {wsConnected ? "● Live AI Stream" : "○ Disconnected"}
                  </Text>
                </View>

                {confidence > 0 && (
                  <View style={styles.confPill}>
                    <Text style={styles.confText}>
                      Match {Math.round(confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Live Detected Tokens Ribbon */}
              <View style={styles.liveRibbon}>
                <Text style={styles.ribbonLabel}>DETECTED SENTENCE BUFFER</Text>
                <Text style={styles.ribbonText}>
                  {tokens.length > 0
                    ? tokens.join(" ")
                    : "Make gestures in front of the camera to translate…"}
                </Text>
              </View>

              <View style={styles.cameraControls}>
                <Pressable
                  accessibilityRole="button"
                  onPress={toggleStreaming}
                  style={[
                    styles.streamBtn,
                    isStreaming ? styles.streamBtnStop : styles.streamBtnStart,
                  ]}
                >
                  <Text style={styles.streamBtnText}>
                    {isStreaming ? "Stop Live Translation" : "Start Live Camera Stream"}
                  </Text>
                </Pressable>

                {tokens.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={clearTokens}
                    style={styles.clearTokensBtn}
                  >
                    <Text style={styles.clearTokensText}>Clear Buffer</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Main Tab Bar */}
      <MainTabBar activeTab="Translate" onChange={onTabChange} />

      {/* Sentence Visualizer Modal */}
      <SentencePlayerModal
        visible={playerVisible}
        onClose={() => setPlayerVisible(false)}
        originalPhrase={inputText}
        glossTokens={activeGloss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: 18,
    marginVertical: 10,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radii.md - 4,
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
  },
  switchText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  switchTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  inputWrap: {
    position: "relative",
  },
  textInput: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  clearBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  translateAction: {
    marginTop: 4,
  },
  samplesSection: {
    marginTop: 16,
  },
  samplesLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  samplesScroll: {
    gap: 8,
  },
  sampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  samplePressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  sampleChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  resultCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    gap: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tokenCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tokensWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  glossPill: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  glossText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  playSequenceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: radii.md,
    minHeight: touchMin,
    gap: 8,
    marginTop: 4,
  },
  playSequencePressed: {
    opacity: 0.88,
  },
  playSequenceIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  playSequenceText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cameraContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  permissionBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  permissionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  cameraStage: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    position: "relative",
  },
  cameraHudTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wsStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  wsStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  confPill: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  confText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  liveRibbon: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 80,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderRadius: radii.md,
    padding: 12,
    gap: 4,
  },
  ribbonLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
  },
  ribbonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  cameraControls: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  streamBtn: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  streamBtnStart: {
    backgroundColor: colors.primary,
  },
  streamBtnStop: {
    backgroundColor: colors.error,
  },
  streamBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  clearTokensBtn: {
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearTokensText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
