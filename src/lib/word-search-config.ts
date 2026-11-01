import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeWordSearchWord } from "@/lib/word-search.mjs";

export type GridSize = 10 | 15 | 20;
export type Difficulty = "easy" | "medium" | "hard";

export const GRID_SIZES: GridSize[] = [10, 15, 20];
export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const WORD_TARGETS: Record<GridSize, Record<Difficulty, number>> = {
  10: { easy: 5, medium: 7, hard: 9 },
  15: { easy: 8, medium: 12, hard: 16 },
  20: { easy: 12, medium: 17, hard: 22 },
};

const MIN_WORD_LENGTH: Record<Difficulty, number> = { easy: 2, medium: 4, hard: 6 };

export const PREVIEW_LETTERS = [
  ["W", "S", "E", "A", "R", "C", "H", "O"],
  ["L", "E", "A", "R", "N", "I", "N", "G"],
  ["T", "I", "M", "E", "F", "U", "N", "D"],
  ["P", "L", "A", "Y", "E", "R", "S", "X"],
  ["Q", "M", "K", "T", "V", "O", "C", "A"],
  ["B", "B", "L", "U", "E", "W", "O", "R"],
  ["D", "S", "G", "A", "M", "E", "C", "H"],
  ["I", "P", "S", "F", "O", "C", "U", "S"],
];

export function selectableWords(
  words: VocabularyWord[],
  category: string,
  difficulty: Difficulty,
  size: GridSize
) {
  const seen = new Set<string>();
  return words.flatMap((word) => {
    const normalized = normalizeWordSearchWord(word.word);
    if (
      (category !== "all" && word.category !== category) ||
      normalized.length < MIN_WORD_LENGTH[difficulty] ||
      normalized.length > size ||
      seen.has(normalized)
    ) return [];
    seen.add(normalized);
    return [{ id: word.id, word: word.word }];
  });
}
