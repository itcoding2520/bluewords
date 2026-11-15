import type { VocabularyWord } from "@/data/vocabulary";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";

export type MatchPair = {
  id: string;
  word: string;
  meaning: string;
  imagePath: string | null;
  imageUrl: string | null;
};

export function buildWordMatchPairs(words: VocabularyWord[], category: string): MatchPair[] {
  const eligibleWords = category === "all"
    ? words
    : words.filter((word) => word.category === category);
  const usedWords = new Set<string>();
  const usedMatches = new Set<string>();
  return eligibleWords.flatMap((word) => {
    const text = word.word.trim();
    const meaning = getPrimaryVocabularyMeaning(word);
    const matchKey = word.imagePath || word.imageUrl
      ? `image:${word.id}`
      : `meaning:${meaning.toLocaleLowerCase()}`;
    if (!text || !meaning || usedWords.has(text.toLocaleLowerCase()) || usedMatches.has(matchKey)) return [];
    usedWords.add(text.toLocaleLowerCase());
    usedMatches.add(matchKey);
    return [{
      id: word.id,
      word: text,
      meaning,
      imagePath: word.imagePath ?? null,
      imageUrl: word.imageUrl ?? null,
    }];
  });
}
