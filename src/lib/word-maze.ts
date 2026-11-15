import type { VocabularyWord } from "@/data/vocabulary";
import { shuffle } from "@/lib/quiz-random";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

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
    const meaningKey = normalizeVocabularyLabel(meaning);
    if (!text || !meaning || (category !== "all" && word.category !== category)
      || seenWords.has(normalizeVocabularyLabel(text)) || seenMeanings.has(meaningKey)) return [];
    seenWords.add(normalizeVocabularyLabel(text));
    seenMeanings.add(meaningKey);
    return [{ id: word.id, word: text, meaning, category: word.category }];
  });
  const chosen = shuffle(available).slice(0, 5);
  return chosen.map((answer) => {
    const distractors = shuffle(available.filter((word) =>
      word.id !== answer.id && normalizeVocabularyLabel(word.meaning) !== normalizeVocabularyLabel(answer.meaning)
    )).slice(0, 3).map((word) => word.meaning);
    return { ...answer, choices: shuffle([answer.meaning, ...distractors]) };
  });
}
