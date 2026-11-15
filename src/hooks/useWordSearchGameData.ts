import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { WORD_TARGETS, selectableWords, buildWordSearchCategoryOptions, type Difficulty, type GridSize } from "@/lib/word-search-config";

export function useWordSearchGameData({
  words,
  categories,
  category,
  difficulty,
  gridSize,
  phase,
  tab,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  difficulty: Difficulty;
  gridSize: GridSize;
  phase: "setup" | "playing" | "results";
  tab: "play" | "history";
}) {
  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const vocabularyById = useMemo(() => new Map(words.map((word) => [word.id, word] as const)), [words]);
  const vocabularyByWord = useMemo(() => new Map(words.map((word) => [normalizeWordSearchWord(word.word), word] as const)), [words]);
  const categoryOptions = useMemo(
    () => buildWordSearchCategoryOptions(categories, words),
    [categories, words]
  );
  const targetCount = Math.min(WORD_TARGETS[gridSize][difficulty], candidates.length);

  return {
    candidates,
    vocabularyById,
    vocabularyByWord,
    categoryOptions,
    targetCount,
    showStickyStart: phase === "setup" && tab === "play",
  };
}
