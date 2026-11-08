import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";

export type QuizMode = "type-word" | "choose-meaning";
export type QuizPhase = "setup" | "playing" | "results";
export type QuizTab = "play" | "history";
export type QuizSaveState = "idle" | "saving" | "saved" | "error";

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

export function sampleRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const sampleSize = Math.min(Math.max(0, count), pool.length);
  for (let index = 0; index < sampleSize; index += 1) {
    const target = index + Math.floor(Math.random() * (pool.length - index));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, sampleSize);
}

export function sampleRandomMatching<T>(items: T[], count: number, matches: (item: T) => boolean): T[] {
  const sample: T[] = [];
  let matched = 0;
  for (const item of items) {
    if (!matches(item)) continue;
    matched += 1;
    if (sample.length < count) {
      sample.push(item);
      continue;
    }
    const replacementIndex = Math.floor(Math.random() * matched);
    if (replacementIndex < count) sample[replacementIndex] = item;
  }
  return sample;
}

function meaningsFor(word: VocabularyWord): VocabularyMeaning[] {
  const detailed = word.type === "expression" ? [] : word.detailedMeanings?.filter((item) => item.meaning.trim()) ?? [];
  return detailed.length > 0 ? detailed : word.meaning.trim()
    ? [{ partOfSpeech: "noun", meaning: word.meaning.trim() }]
    : [];
}

export function buildMeaningQuestions(words: VocabularyWord[]): QuizQuestion[] {
  const entries = words.map((word) => ({ word, meanings: meaningsFor(word) }));
  const uniqueAnswers = [...new Map(entries
    .flatMap(({ meanings }) => meanings.map((meaning) => meaning.meaning.trim()))
    .map((meaning) => [meaning.toLocaleLowerCase(), meaning] as const)).values()];
  const uniqueWords = [...new Map(words.map((word) => [normalizeQuizAnswer(word.word), word.word.trim()] as const))]
    .map(([normalized, word]) => ({ normalized, word }));

  return shuffle(entries.flatMap(({ word, meanings: wordMeanings }) => {
    if (wordMeanings.length === 0) return [];
    const meaning = wordMeanings[Math.floor(Math.random() * wordMeanings.length)];
    const normalizedMeaning = meaning.meaning.trim().toLocaleLowerCase();
    const meaningDistractors = shuffle(sampleRandomMatching(
      uniqueAnswers,
      3,
      (answer) => answer.toLocaleLowerCase() !== normalizedMeaning
    ));
    const normalizedWord = normalizeQuizAnswer(word.word);
    const wordDistractors = shuffle(sampleRandomMatching(
      uniqueWords,
      3,
      (answer) => answer.normalized !== normalizedWord
    )).map((answer) => answer.word);
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
      choices: sampleRandom([correctAnswer, ...distractors], distractors.length + 1),
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
