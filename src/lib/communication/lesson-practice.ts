export type LessonDifficulty = "easy" | "medium" | "hard";

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

export function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
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
  const commonWords = new Set(["this", "that", "with", "from", "your", "have", "will", "would", "could", "there", "their", "they", "them", "what", "when", "where", "which", "about", "after", "before", "into", "like", "want", "some", "very", "much", "than", "then", "also", "does", "the", "and", "for", "you", "are"]);
  const vocabulary = [...new Set(items.flatMap((item) => `${item.content_en} ${item.example_en}`.match(/[\p{L}][\p{L}'’-]*/gu) ?? []).filter((word) => word.length >= 3 && !commonWords.has(word.toLocaleLowerCase())))];
  return items.flatMap((item) => {
    const sentence = item.example_en.trim();
    if (!sentence) return [];
    const clue = item.example_vi.trim() || item.meaning_vi;
    const drills: SentenceDrill<T>[] = [];
    const sentenceWords = sentence.match(/[^\s]+/g) ?? [];
    if (sentenceWords.length >= 4) {
      const tiles = shuffled(sentenceWords.map((text, id) => ({ id, text })));
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
      const choices = shuffled([...new Set([answer, ...shuffled(vocabulary.filter((word) => word.toLocaleLowerCase() !== answer.toLocaleLowerCase())).slice(0, 3)])]);
      if (choices.length >= 2) drills.push({ id: `${item.id}:complete`, item, kind: "complete", sentence, clue, answer, gapSentence, choices });
    }
    return drills;
  });
}
