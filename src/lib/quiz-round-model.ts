import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { shuffle } from "@/lib/quiz-random";

/** Selects and prepares a randomized round without mutating the source pools. */
export function buildQuizRoundQuestions({
  mode,
  eligibleWords,
  meaningQuestions,
  questionCount,
}: {
  mode: QuizMode;
  eligibleWords: VocabularyWord[];
  meaningQuestions: QuizQuestion[];
  questionCount: number;
}): QuizQuestion[] | null {
  const pool: QuizQuestion[] = mode === "type-word"
    ? shuffle(eligibleWords).map((word) => ({
        word,
        meaning: "",
        partOfSpeech: null,
        choices: [],
        choiceType: "word",
        correctAnswer: word.word,
      }))
    : shuffle(meaningQuestions);
  const questions = pool.slice(0, questionCount);
  return questions.length === questionCount ? questions : null;
}
