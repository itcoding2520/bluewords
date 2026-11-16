import { shuffle, shuffleAndTake } from "@/lib/random";
import type { DifficultyLevel } from "@/types/difficulty";

export type LessonDifficulty = DifficultyLevel;

export type SentenceDrillItem = {
  id: string;
  content_en: string;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
};

export type SentenceDrill<T extends SentenceDrillItem = SentenceDrillItem> = {
  id: string;
  item: T;
  kind: "complete" | "order";
  sentence: string;
  clue: string;
  answer: string;
  choices?: string[];
  gapSentence?: string;
  tiles?: Array<{ id: number; text: string }>;
};

const commonWords = new Set(["this", "that", "with", "from", "your", "have", "will", "would", "could", "there", "their", "they", "them", "what", "when", "where", "which", "about", "after", "before", "into", "like", "want", "some", "very", "much", "than", "then", "also", "does", "the", "and", "for", "you", "are"]);

function getSentenceDrillVocabulary(items: SentenceDrillItem[]): string[] {
  const vocabulary = new Set<string>();
  for (const item of items) {
    const words = `${item.content_en} ${item.example_en}`.match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
    for (const word of words) {
      if (word.length >= 3 && !commonWords.has(word.toLocaleLowerCase())) vocabulary.add(word);
    }
  }
  return [...vocabulary];
}

export function createAnswerChoices(correctAnswer: string, distractors: string[]) {
  return shuffle([...new Set([correctAnswer, ...shuffleAndTake(distractors, 3)])]);
}

export function getCorrectReviewIntervalDays(reviewCount: number, correctCount: number, difficulty: LessonDifficulty) {
  if (correctCount <= 1) return 1;

  const accuracy = correctCount / Math.max(reviewCount, 1);
  const schedule = accuracy >= 0.9
    ? [1, 3, 7, 14, 21, 30]
    : accuracy >= 0.7
      ? [1, 2, 4, 7, 10, 14]
      : [1, 1, 2, 3, 5, 7];
  const baseDays = schedule[Math.min(correctCount - 1, schedule.length - 1)];

  if (difficulty === "easy") return Math.ceil(baseDays * 1.2);
  if (difficulty === "hard") return Math.max(1, Math.floor(baseDays * 0.7));
  return baseDays;
}

export function normalizeSentence(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").toLocaleLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSentenceDrills<T extends SentenceDrillItem>(items: T[]): SentenceDrill<T>[] {
  const vocabulary = getSentenceDrillVocabulary(items);
  const drills: SentenceDrill<T>[] = [];
  for (const item of items) {
    const sentence = item.example_en.trim();
    if (!sentence) continue;
    const clue = item.example_vi.trim() || item.meaning_vi;
    const sentenceWords = sentence.match(/[^\s]+/g) ?? [];
    if (sentenceWords.length >= 4) {
      const tiles = shuffle(sentenceWords.map((text, id) => ({ id, text })));
      if (tiles.every((tile, index) => tile.id === index)) tiles.push(tiles.shift()!);
      drills.push({ id: `${item.id}:order`, item, kind: "order", sentence, clue, answer: sentence, tiles });
    }
    const phrase = item.content_en.trim();
    const exactPhrase = phrase.length > 0 && !phrase.includes("...") && new RegExp(escapeRegExp(phrase), "i").test(sentence);
    const candidates = sentence.match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
    const fallback = [...candidates].reverse().find((word) => word.length >= 4 && !commonWords.has(word.toLocaleLowerCase()));
    const answer = exactPhrase ? phrase : fallback ?? "";
    if (answer) {
      const pattern = exactPhrase ? new RegExp(escapeRegExp(answer), "i") : new RegExp(`\\b${escapeRegExp(answer)}\\b`, "i");
      const gapSentence = sentence.replace(pattern, "________");
      const distractors = vocabulary.filter((word) => word.toLocaleLowerCase() !== answer.toLocaleLowerCase());
      const choices = createAnswerChoices(answer, distractors);
      if (choices.length >= 2) drills.push({ id: `${item.id}:complete`, item, kind: "complete", sentence, clue, answer, gapSentence, choices });
    }
  }
  return drills;
}
