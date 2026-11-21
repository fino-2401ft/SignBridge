import type { JSX } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { QuizQuestion } from "../../types/gamification";
import { colors, radii, touchMin } from "../../utils/theme";

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSelected: (selectedIndex: number) => void;
}

export function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  onAnswerSelected,
}: QuizCardProps): JSX.Element {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number): void => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    onAnswerSelected(idx);
  };

  return (
    <View style={styles.card}>
      {/* Top progress */}
      <View style={styles.header}>
        <Text style={styles.stepText}>
          Question {questionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>

      {/* Target hint box */}
      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>“{question.explanation}”</Text>
      </View>

      {/* Options grid */}
      <View style={styles.optionsWrap}>
        {question.options.map((opt, idx) => {
          const isChosen = selectedOption === idx;
          const isCorrect = idx === question.correctIndex;

          let btnBg: string = colors.surface;
          let borderColor: string = colors.border;
          let textColor: string = colors.text;

          if (answered) {
            if (isCorrect) {
              btnBg = colors.successSoft;
              borderColor = colors.success;
              textColor = colors.success;
            } else if (isChosen) {
              btnBg = colors.errorSoft;
              borderColor = colors.error;
              textColor = colors.error;
            }
          } else if (isChosen) {
            btnBg = colors.primarySoft;
            borderColor = colors.primary;
            textColor = colors.primary;
          }

          return (
            <Pressable
              key={idx}
              disabled={answered}
              onPress={() => handleSelect(idx)}
              style={({ pressed }) => [
                styles.optionBtn,
                { backgroundColor: btnBg, borderColor },
                pressed && !answered && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionIndex, { color: textColor }]}>
                {String.fromCharCode(65 + idx)}
              </Text>
              <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  prompt: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  hintBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  hintTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 18,
  },
  optionsWrap: {
    gap: 10,
    marginTop: 4,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionIndex: {
    fontSize: 14,
    fontWeight: "900",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
});
