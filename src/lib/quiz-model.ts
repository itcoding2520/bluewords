import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";

export type QuizMode = "type-word" | "choose-meaning";

export interface QuizQuestion {
  word: VocabularyWord;
  meaning: string;
  partOfSpeech: string | null;
  choices: string[];
  choiceType: "meaning" | "word";
  correctAnswer: string;
}

export interface QuizAnswer {
  value: string;
  correct: boolean;
}

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function meaningsFor(word: VocabularyWord): VocabularyMeaning[] {
  const detailed = word.type === "expression" ? [] : word.detailedMeanings?.filter((item) => item.meaning.trim()) ?? [];
  return detailed.length > 0 ? detailed : word.meaning.trim()
    ? [{ partOfSpeech: "noun", meaning: word.meaning.trim() }]
    : [];
}

export function buildMeaningQuestions(words: VocabularyWord[]): QuizQuestion[] {
  const answerPool = words.flatMap((word) => meaningsFor(word).map((meaning) => ({ meaning: meaning.meaning.trim() })));
  const uniqueAnswers = [...new Map(answerPool.map((answer) => [answer.meaning.toLocaleLowerCase(), answer])).values()];
  const uniqueWords = [...new Map(words.map((word) => [normalizeQuizAnswer(word.word), word.word.trim()] as const)).values()];

  return shuffle(words.flatMap((word) => {
    const wordMeanings = meaningsFor(word);
    if (wordMeanings.length === 0) return [];
    const meaning = shuffle(wordMeanings)[0];
    const meaningDistractors = shuffle(uniqueAnswers
      .filter((answer) => answer.meaning.toLocaleLowerCase() !== meaning.meaning.trim().toLocaleLowerCase())
      .map((answer) => answer.meaning)).slice(0, 3);
    const normalizedWord = normalizeQuizAnswer(word.word);
    const wordDistractors = shuffle(uniqueWords.filter((answer) => normalizeQuizAnswer(answer) !== normalizedWord)).slice(0, 3);
    const canChooseMeaning = meaningDistractors.length === 3;
    const canChooseWord = wordDistractors.length === 3;
    if (!canChooseMeaning && !canChooseWord) return [];
    const choiceType: QuizQuestion["choiceType"] = canChooseMeaning && canChooseWord
      ? Math.random() < 0.5 ? "meaning" : "word"
      : canChooseMeaning ? "meaning" : "word";
    const correctAnswer = choiceType === "meaning" ? meaning.meaning.trim() : word.word.trim();
    const distractors = choiceType === "meaning" ? meaningDistractors : wordDistractors;
    return [{
      word,
      meaning: meaning.meaning.trim(),
      partOfSpeech: word.type !== "expression" && word.detailedMeanings?.some((item) => item.meaning.trim()) ? meaning.partOfSpeech : null,
      choices: shuffle([correctAnswer, ...distractors]),
      choiceType,
      correctAnswer,
    }];
  }));
}

export function expectedAnswer(question: QuizQuestion, mode: QuizMode): string {
  if (mode === "type-word" || question.choiceType === "word") return question.word.word;
  // Keep older in-memory quiz sessions answerable during development refreshes.
  return typeof question.correctAnswer === "string" ? question.correctAnswer : question.meaning;
}

export function promptText(question: QuizQuestion, mode: QuizMode): string {
  if (mode === "type-word") return "Image → Type the word";
  if (question.choiceType === "word") return "Meaning → Choose the word";
  return question.word.imagePath ? "Image → Choose the meaning" : "Word → Choose the meaning";
}

export function formatQuizTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
