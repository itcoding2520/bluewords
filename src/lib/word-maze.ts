import type { VocabularyWord } from "@/data/vocabulary";
import { shuffle } from "@/lib/random";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export type MazeWord = {
  id: string;
  word: string;
  meaning: string;
  category: string;
  choices: string[];
};

export function buildWordMazeRound(words: VocabularyWord[], category: string): MazeWord[] {
  const seenWords = new Set<string>();
  const seenMeanings = new Set<string>();
  const available = words.flatMap((word) => {
    const text = word.word.trim();
    const meaning = getPrimaryVocabularyMeaning(word);
    const wordKey = normalizeVocabularyLabel(text);
    const meaningKey = normalizeVocabularyLabel(meaning);
    if (!text || !meaning || !matchesVocabularyCategory(word.category, category)
      || seenWords.has(wordKey) || seenMeanings.has(meaningKey)) return [];
    seenWords.add(wordKey);
    seenMeanings.add(meaningKey);
    return [{ id: word.id, word: text, meaning, meaningKey, category: word.category }];
  });
  const chosen = shuffle(available).slice(0, 5);
  return chosen.map((answer) => {
    const distractors = shuffle(available.filter((word) =>
      word.id !== answer.id && word.meaningKey !== answer.meaningKey
    )).slice(0, 3).map((word) => word.meaning);
    return {
      id: answer.id,
      word: answer.word,
      meaning: answer.meaning,
      category: answer.category,
      choices: shuffle([answer.meaning, ...distractors]),
    };
  });
}
