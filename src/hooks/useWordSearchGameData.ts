import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { WORD_TARGETS, selectableWords, buildWordSearchCategoryOptions, type Difficulty, type GridSize } from "@/lib/word-search-config";
import type { GamePhase, GameTab } from "@/types/game";

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
  phase: GamePhase;
  tab: GameTab;
}) {
  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const { vocabularyById, vocabularyByWord } = useMemo(() => {
    const byId = new Map<string, VocabularyWord>();
    const byWord = new Map<string, VocabularyWord>();
    for (const word of words) {
      byId.set(word.id, word);
      byWord.set(normalizeWordSearchWord(word.word), word);
    }
    return { vocabularyById: byId, vocabularyByWord: byWord };
  }, [words]);
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
