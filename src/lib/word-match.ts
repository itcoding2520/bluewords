import type { VocabularyWord } from "@/data/vocabulary";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export type MatchPair = {
  id: string;
  word: string;
  meaning: string;
  imagePath: string | null;
  imageUrl: string | null;
};

export type MatchCardData = { id: string; pairId: string; kind: "word" | "match" };

export function buildWordMatchPairs(words: VocabularyWord[], category: string): MatchPair[] {
  const usedWords = new Set<string>();
  const usedMatches = new Set<string>();
  const pairs: MatchPair[] = [];
  for (const word of words) {
    if (!matchesVocabularyCategory(word.category, category)) continue;
    const text = word.word.trim();
    const meaning = getPrimaryVocabularyMeaning(word);
    const wordKey = normalizeVocabularyLabel(text);
    const matchKey = word.imagePath || word.imageUrl
      ? `image:${word.id}`
      : `meaning:${normalizeVocabularyLabel(meaning)}`;
    if (!text || !meaning || usedWords.has(wordKey) || usedMatches.has(matchKey)) continue;
    usedWords.add(wordKey);
    usedMatches.add(matchKey);
    pairs.push({
      id: word.id,
      word: text,
      meaning,
      imagePath: word.imagePath ?? null,
      imageUrl: word.imageUrl ?? null,
    });
  }
  return pairs;
}
