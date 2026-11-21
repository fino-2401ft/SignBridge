import type { Sign } from "../types/dictionary";
import type { QuizQuestion, QuizResult } from "../types/gamification";

/**
 * Generates an interactive multiple-choice quiz from dictionary signs.
 */
export function generateQuizQuestions(
  signs: Sign[],
  questionCount = 5,
): QuizQuestion[] {
  if (signs.length < 4) {
    return [];
  }

  // Shuffle candidate signs
  const shuffled = [...signs].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(questionCount, signs.length));

  return selected.map((targetSign, idx) => {
    // Pick 3 distractor signs different from target
    const distractors = signs
      .filter((s) => s.id !== targetSign.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((s) => s.title);

    const options = [targetSign.title, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(targetSign.title);

    return {
      id: `quiz-q-${idx + 1}-${targetSign.id}`,
      signId: targetSign.id,
      signTitle: targetSign.title,
      prompt: `Which ASL sign matches the gesture description?`,
      videoUrl: targetSign.videoUrl || "",
      options: options as [string, string, string, string],
      correctIndex,
      explanation: targetSign.description || `This gesture represents "${targetSign.title}".`,
    };
  });
}

/**
 * Calculates quiz score and XP reward.
 */
export function evaluateQuizSubmission(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): QuizResult {
  let correctCount = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  }

  const totalQuestions = Math.max(1, questions.length);
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const earnedXp = correctCount * 25 + (scorePercent === 100 ? 50 : 0);

  return {
    totalQuestions,
    correctCount,
    scorePercent,
    earnedXp,
    completedAt: new Date().toISOString(),
  };
}
