import type { VocabularyWord } from "@/data/vocabulary";
import { sampleRandomMatching, shuffle, shuffleAndTake } from "@/lib/random";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export const WORD_MAZE_QUESTION_COUNT = 5;
export const WORD_MAZE_LIVES = 3;

export type MazeWord = {
  id: string;
  word: string;
  meaning: string;
  category: string;
  choices: string[];
};

type MazeCandidate = Omit<MazeWord, "choices"> & { meaningKey: string };

export function buildWordMazeRound(words: VocabularyWord[], category: string): MazeWord[] {
  const seenWords = new Set<string>();
  const seenMeanings = new Set<string>();
  const available: MazeCandidate[] = [];
  for (const word of words) {
    const text = word.word.trim();
    const meaning = getPrimaryVocabularyMeaning(word);
    const wordKey = normalizeVocabularyLabel(text);
    const meaningKey = normalizeVocabularyLabel(meaning);
    if (!text || !meaning || !matchesVocabularyCategory(word.category, category)
      || seenWords.has(wordKey) || seenMeanings.has(meaningKey)) continue;
    seenWords.add(wordKey);
    seenMeanings.add(meaningKey);
    available.push({ id: word.id, word: text, meaning, meaningKey, category: word.category });
  }
  const chosen = shuffleAndTake(available, WORD_MAZE_QUESTION_COUNT);
  return chosen.map((answer) => {
    const distractors = shuffle(sampleRandomMatching(
      available,
      3,
      (word) => word.id !== answer.id && word.meaningKey !== answer.meaningKey,
    )).map((word) => word.meaning);
    return {
      id: answer.id,
      word: answer.word,
      meaning: answer.meaning,
      category: answer.category,
      choices: shuffle([answer.meaning, ...distractors]),
    };
  });
}
