import { shuffle } from "@/lib/random";
import { createAnswerChoices } from "@/lib/communication/lesson-practice";

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
