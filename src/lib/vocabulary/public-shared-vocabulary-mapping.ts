import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { createCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
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
  const sharedByName = new Map(shared.categories.map((category) => [normalizeVocabularyLabel(category.name), category]));
  const defaultNames = new Set(defaultVocabularyCategories.map((category) => normalizeVocabularyLabel(category.name)));

  return [
    ...defaultVocabularyCategories.map((category) => ({
      ...category,
      image_path: sharedByName.get(normalizeVocabularyLabel(category.name))?.image_path ?? category.image_path ?? null,
    })),
    ...shared.categories
      .filter((category) => !defaultNames.has(normalizeVocabularyLabel(category.name)))
      .map((category) => ({
        id: createCommunityCategoryId(category.id),
        user_id: "community",
        name: category.name,
        color: category.color,
        is_default: false,
        created_at: "",
        updated_at: "",
        image_path: category.image_path ?? null,
      })),
  ];
}

export function mapPublicWords(shared: PublicSharedVocabulary): VocabularyWord[] {
  return mapCommunityVocabularyWords(
    shared.words,
    defaultVocabularyWords,
    { skipUncategorized: true, includeImageUrl: true },
  );
}
