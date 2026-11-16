import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export type CommunityVocabularyWordSource = {
  id: string;
  word: string;
  meaning: string;
  category: string;
  ipa: string | null;
  imageUrl?: string | null;
};

export function mapCommunityVocabularyWords(
  words: CommunityVocabularyWordSource[],
  existingWords: Pick<VocabularyWord, "word" | "category">[],
  {
    skipUncategorized = false,
    includeImageUrl = false,
  }: { skipUncategorized?: boolean; includeImageUrl?: boolean } = {},
): VocabularyWord[] {
  const existingKeys = new Set<string>();
  for (const item of existingWords) {
    existingKeys.add(`${normalizeVocabularyLabel(item.category)}\u0000${normalizeVocabularyLabel(item.word)}`);
  }

  const mappedWords: VocabularyWord[] = [];
  for (const word of words) {
    const key = `${normalizeVocabularyLabel(word.category)}\u0000${normalizeVocabularyLabel(word.word)}`;
    if ((skipUncategorized && !word.category) || existingKeys.has(key)) continue;

    mappedWords.push({
      id: `community-${word.id}`,
      word: word.word,
      meaning: word.meaning,
      category: word.category,
      status: "learning" as const,
      type: "word" as const,
      ipa: word.ipa,
      imagePath: null,
      ...(includeImageUrl ? { imageUrl: word.imageUrl ?? null } : {}),
      detailedMeanings: [],
      isCustom: true,
    });
  }
  return mappedWords;
}
