import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import type { VocabularyCategory } from "@/config/vocabulary";
import type { VocabularyMeaningRow } from "@/types/database";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";

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

function normalizeLabel(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function mapVocabularyMeaning(row: VocabularyMeaningRow): VocabularyMeaning {
  return {
    id: row.id,
    partOfSpeech: row.part_of_speech,
    meaning: row.meaning,
  };
}

export function mapVocabularyWordRow(row: VocabularyWordWithMeaningsRow): VocabularyWord {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    category: row.category as VocabularyCategory,
    status: row.status,
    type: row.type ?? "word",
    ipa: row.ipa ?? null,
    imagePath: row.image_path ?? null,
    detailedMeanings: (row.vocabulary_meanings ?? []).map(mapVocabularyMeaning),
  };
}

export function sortCategories(categories: VocabularyCategoryRow[]): VocabularyCategoryRow[] {
  return [...categories].sort((left, right) => {
    if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

export async function loadPublicSharedVocabulary(): Promise<PublicSharedVocabulary> {
  const response = await fetch("/api/public-vocabulary", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load approved shared vocabulary.");
  return await response.json() as PublicSharedVocabulary;
}

export function mapPublicCategories(shared: PublicSharedVocabulary): VocabularyCategoryRow[] {
  const sharedByName = new Map(shared.categories.map((category) => [normalizeLabel(category.name), category]));
  const defaultNames = new Set(defaultVocabularyCategories.map((category) => normalizeLabel(category.name)));

  return [
    ...defaultVocabularyCategories.map((category) => ({
      ...category,
      image_path: sharedByName.get(normalizeLabel(category.name))?.image_path ?? category.image_path ?? null,
    })),
    ...shared.categories
      .filter((category) => !defaultNames.has(normalizeLabel(category.name)))
      .map((category) => ({
        id: `community-category-${category.id}`,
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
  const defaultKeys = new Set(defaultVocabularyWords.map((word) =>
    `${normalizeLabel(word.category)}\u0000${normalizeLabel(word.word)}`
  ));

  return shared.words.flatMap((word) => {
    const key = `${normalizeLabel(word.category)}\u0000${normalizeLabel(word.word)}`;
    if (!word.category || defaultKeys.has(key)) return [];

    return [{
      id: `community-${word.id}`,
      word: word.word,
      meaning: word.meaning,
      category: word.category as VocabularyCategory,
      status: "learning" as const,
      type: "word" as const,
      ipa: word.ipa,
      imagePath: null,
      imageUrl: word.imageUrl ?? null,
      detailedMeanings: [],
      isCustom: true,
    }];
  });
}
