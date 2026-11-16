import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { mapCommunityVocabularyCategories } from "@/lib/vocabulary/community-vocabulary-categories";
import { mapCommunityVocabularyWords } from "@/lib/vocabulary/community-vocabulary-words";

export type PublicSharedVocabulary = {
  categories: Array<{
    id: string;
    name: string;
    color: VocabularyCategoryColor;
    image_path?: string | null;
  }>;
  words: Array<{
    id: string;
    word: string;
    meaning: string;
    ipa: string | null;
    category: string;
    imageUrl?: string | null;
  }>;
};

export function mapPublicCategories(shared: PublicSharedVocabulary): VocabularyCategoryRow[] {
  return mapCommunityVocabularyCategories(
    defaultVocabularyCategories,
    shared.categories,
    () => ({ userId: "community", createdAt: "", updatedAt: "" }),
  );
}

export function mapPublicWords(shared: PublicSharedVocabulary): VocabularyWord[] {
  return mapCommunityVocabularyWords(
    shared.words,
    defaultVocabularyWords,
    { skipUncategorized: true, includeImageUrl: true },
  );
}
