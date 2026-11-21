import type { JSX } from "react";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlashCard } from "../../components/gamification/FlashCard";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { DEMO_SIGNS } from "../../types/dictionary";
import type { FlashCardItem } from "../../types/gamification";
import { calculateSM2, type QualityGrade } from "../../utils/spacedRepetition";
import { colors, radii, touchMin } from "../../utils/theme";

const INITIAL_CARDS: FlashCardItem[] = DEMO_SIGNS.slice(0, 6).map((s) => ({
  signId: s.id,
  title: s.title,
  category: s.category,
  emoji: s.emoji,
  videoUrl: s.videoUrl,
  description: s.description,
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 1,
  nextReviewDate: new Date().toISOString(),
  mastered: false,
}));

interface FlashCardReviewScreenProps {
  onBack?: () => void;
}

export function FlashCardReviewScreen({ onBack }: FlashCardReviewScreenProps): JSX.Element {
  const [cards, setCards] = useState<FlashCardItem[]>(INITIAL_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const currentCard = cards[currentIndex];

  const handleGrade = useCallback(
    (grade: QualityGrade) => {
      if (!currentCard) return;

      const updatedSchedule = calculateSM2(currentCard, grade);
      const updatedCards = [...cards];
      updatedCards[currentIndex] = {
        ...currentCard,
        ...updatedSchedule,
      };
      setCards(updatedCards);
      setIsFlipped(false);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    },
    [currentCard, cards, currentIndex],
  );

  const restartReview = (): void => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Spaced Review</Text>
          <Text style={styles.sub}>
            Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}
          </Text>
        </View>
      </View>

      {sessionCompleted || !currentCard ? (
        <View style={styles.completeBox}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Review Session Complete!</Text>
          <Text style={styles.completeDesc}>
            Great job! Your sign retention schedules have been updated via SM-2.
          </Text>
          <View style={styles.actionRow}>
            <PrimaryButton label="Practice Again" onPress={restartReview} />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <FlashCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {/* SM-2 Rating Buttons (Visible when flipped) */}
          {isFlipped ? (
            <View style={styles.gradeSection}>
              <Text style={styles.gradeTitle}>HOW WELL DID YOU REMEMBER?</Text>
              <View style={styles.gradeRow}>
                <Pressable
                  onPress={() => handleGrade(1)}
                  style={[styles.gradeBtn, { backgroundColor: colors.errorSoft }]}
                >
                  <Text style={[styles.gradeBtnText, { color: colors.error }]}>Again</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(3)}
                  style={[styles.gradeBtn, { backgroundColor: colors.warningSoft }]}
                >
                  <Text style={[styles.gradeBtnText, { color: colors.warning }]}>Hard</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(4)}
                  style={[styles.gradeBtn, { backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[styles.gradeBtnText, { color: colors.primary }]}>Good</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(5)}
                  style={[styles.gradeBtn, { backgroundColor: colors.successSoft }]}
                >
                  <Text style={[styles.gradeBtnText, { color: colors.success }]}>Easy</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.instruction}>Tap the card to view gesture answer</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  header: {
    marginBottom: 12,
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  titleWrap: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  instruction: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  gradeSection: {
    width: "100%",
    gap: 8,
  },
  gradeTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  gradeRow: {
    flexDirection: "row",
    gap: 8,
  },
  gradeBtn: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  completeBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  completeEmoji: {
    fontSize: 54,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },
  completeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  actionRow: {
    marginTop: 12,
    width: 200,
  },
});
