import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { createCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export type CommunityVocabularyCategorySource = {
  id: string;
  name: string;
  color: VocabularyCategoryColor;
  image_path?: string | null;
};

export function mapCommunityVocabularyCategories<TCategory extends CommunityVocabularyCategorySource>(
  baseCategories: VocabularyCategoryRow[],
  communityCategories: TCategory[],
  getCommunityMetadata: (category: TCategory) => {
    userId: string;
    createdAt: string;
    updatedAt: string;
  },
): VocabularyCategoryRow[] {
  const sharedByName = new Map<string, TCategory>();
  for (const category of communityCategories) {
    sharedByName.set(normalizeVocabularyLabel(category.name), category);
  }

  const baseNames = new Set<string>();
  const baseWithSharedImages: VocabularyCategoryRow[] = [];
  for (const category of baseCategories) {
    const normalizedName = normalizeVocabularyLabel(category.name);
    baseNames.add(normalizedName);
    baseWithSharedImages.push({
      ...category,
      image_path: sharedByName.get(normalizedName)?.image_path
        ?? category.image_path
        ?? null,
    });
  }

  const sharedOnlyCategories: VocabularyCategoryRow[] = [];
  for (const category of communityCategories) {
    if (baseNames.has(normalizeVocabularyLabel(category.name))) continue;
    const metadata = getCommunityMetadata(category);
    sharedOnlyCategories.push({
      id: createCommunityCategoryId(category.id),
      user_id: metadata.userId,
      name: category.name,
      color: category.color,
      is_default: false,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      image_path: category.image_path ?? null,
    });
  }

  return [...baseWithSharedImages, ...sharedOnlyCategories];
}
